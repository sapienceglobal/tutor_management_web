'use client';

import { useState, useEffect } from 'react';
import { Loader2, DollarSign, CreditCard, TrendingUp, Calendar } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function AdminEarningsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalRevenue: 0,
        revenueChart: [],
        recentTransactions: []
    });

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const res = await api.get('/admin/earnings');
                if (res.data.success) {
                    setData(res.data.financials);
                }
            } catch (error) {
                console.error('Failed to fetch financials:', error);
                toast.error('Failed to load financial data');
            } finally {
                setLoading(false);
            }
        };

        fetchFinancials();
    }, []);

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
                <h1 className="text-2xl font-bold text-slate-800">Financial Overview</h1>
                <p className="text-slate-500">Track platform revenue and transactions</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                ${data.totalRevenue.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-100 rounded-full text-purple-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Avg Order Value</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                ${data.recentTransactions.length > 0
                                    ? (data.totalRevenue / data.recentTransactions.length || 0).toFixed(2) // Approximation based on loaded txns
                                    : '0.00'
                                }
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Transactions</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                {data.recentTransactions.length}+
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Monthly Revenue</h2>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.revenueChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                formatter={(value) => [`$${value}`, 'Revenue']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar
                                dataKey="revenue"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={60}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">ID</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Student</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Course</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Amount</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.recentTransactions.length > 0 ? (
                                data.recentTransactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                            #{txn.id.slice(-6)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {txn.student}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {txn.course}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(txn.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            ${txn.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                {txn.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No recent transactions found.
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
