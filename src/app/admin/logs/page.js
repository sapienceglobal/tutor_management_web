'use client';

import { useState, useEffect } from 'react';
import { 
    Activity, 
    AlertTriangle, 
    CheckCircle, 
    Info, 
    Clock, 
    ShieldAlert,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';

export default function AdminLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const fetchLogs = async (p) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/logs?page=${p}&limit=20`);
            if (res.data.success) {
                setLogs(res.data.logs || []);
                setTotalPages(res.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityIcon = (severity) => {
        switch(severity) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'system': return <ShieldAlert className="w-5 h-5 text-blue-500" />;
            default: return <Info className="w-5 h-5 text-slate-400" />;
        }
    };

    const formatActionType = (type) => {
        return type.replace(/_/g, ' ');
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        System Audit Logs
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Review administrative actions and system events.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
                            <Clock className="w-8 h-8 animate-spin text-slate-300 mb-4" /> 
                            <p>Loading audit logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-lg font-medium text-slate-600">No logs found</p>
                            <p className="text-sm text-slate-400">System actions will appear here.</p>
                        </div>
                    ) : logs.map(log => (
                        <div key={log._id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                            <div className="mt-1 flex-shrink-0">
                                {getSeverityIcon(log.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-slate-900 capitalize">{formatActionType(log.type)}</h3>
                                    <span className="text-xs text-slate-400 flex items-center whitespace-nowrap">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600">{log.message}</p>
                                
                                {log.details && Object.keys(log.details).length > 0 && (
                                    <div className="mt-2 text-xs bg-slate-100 p-2 rounded text-slate-600 font-mono break-all">
                                        {JSON.stringify(log.details)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="p-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
