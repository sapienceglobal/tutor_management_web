'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, AlertTriangle, CheckCircle, Info, Clock, Lock } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminSecurityPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all'); // all, error, warning, info, success

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/logs');
            if (res.data.success) {
                setLogs(res.data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast.error('Failed to load security logs');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'error': return 'text-red-600 bg-red-50';
            case 'warning': return 'text-amber-600 bg-amber-50';
            case 'success': return 'text-emerald-600 bg-emerald-50';
            case 'system': return 'text-purple-600 bg-purple-50';
            default: return 'text-blue-600 bg-blue-50';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'error': return <AlertTriangle className="w-4 h-4" />;
            case 'warning': return <Lock className="w-4 h-4" />;
            case 'success': return <CheckCircle className="w-4 h-4" />;
            case 'system': return <Shield className="w-4 h-4" />;
            default: return <Info className="w-4 h-4" />;
        }
    };

    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(log => log.severity === filter);

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Security & Logs</h1>
                <p className="text-slate-500">Audit system activity and security events</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium">Total Events</div>
                    <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium">Warnings</div>
                    <div className="text-2xl font-bold text-amber-600">
                        {logs.filter(l => l.severity === 'warning').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium">Errors</div>
                    <div className="text-2xl font-bold text-red-600">
                        {logs.filter(l => l.severity === 'error').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-medium">System Checks</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {logs.filter(l => l.severity === 'system').length}
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800">Activity Audit Log</h2>
                    <div className="flex gap-2">
                        {['all', 'info', 'success', 'warning', 'error'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors
                                    ${filter === type
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Severity</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Event Type</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Message</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                                                {getSeverityIcon(log.severity)}
                                                <span className="capitalize">{log.severity}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {log.type}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {log.message}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No logs found matching your filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
