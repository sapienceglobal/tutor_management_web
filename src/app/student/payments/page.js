'use client';

import { CreditCard, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PaymentsPage() {
    // Mock Data
    const transactions = [
        { id: 'TRX-123456', date: '2025-05-15', course: 'Advanced React Patterns', amount: 499, status: 'Completed', invoice: '#' },
        { id: 'TRX-123457', date: '2025-05-10', course: 'UI/UX Design Masterclass', amount: 1299, status: 'Completed', invoice: '#' },
        { id: 'TRX-123458', date: '2025-04-22', course: 'Python for Data Science', amount: 899, status: 'Refunded', invoice: '#' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Payment History</h1>
                    <p className="text-slate-500 mt-1">View your transactions and download invoices.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="Search transactions..." className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Course / Item</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map((trx) => (
                                <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-600">{trx.id}</td>
                                    <td className="px-6 py-4 text-slate-600">{new Date(trx.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{trx.course}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">₹{trx.amount}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant={trx.status === 'Completed' ? 'success' : 'destructive'} className={trx.status === 'Completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}>
                                            {trx.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {transactions.length === 0 && (
                    <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No transactions found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
