'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, 
    CreditCard, Building2, Download, ExternalLink, Activity,
    IndianRupee, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminFinancePage() {
    const [loading, setLoading] = useState(true);
    const [financeData, setFinanceData] = useState({
        kpis: {
            totalRevenue: 0,
            mrr: 0,
            platformCommission: 0,
            pendingPayouts: 0,
            growth: 0
        },
        chartData: [],
        recentTransactions: [],
        pendingSettlements: []
    });

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchFinanceOverview();
    }, []);

    const fetchFinanceOverview = async () => {
        setLoading(true);
        try {
            // REAL API CALL: Backend se saara aggregated data aayega
            const res = await api.get('/superadmin/finance/overview');
            if (res.data.success) {
                setFinanceData(res.data.data);
            }
        } catch (error) {
            // Agar backend ready nahi hai, toh gracefully handle karenge
            toast.error('Failed to sync live finance data. Backend route might be pending.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayout = async (instituteId, amount) => {
        if (!confirm(`Process payout of ₹${amount} to this institute?`)) return;
        try {
            const res = await api.post(`/superadmin/finance/payouts/${instituteId}`);
            if (res.data.success) {
                toast.success('Payout processed & recorded successfully!');
                fetchFinanceOverview(); // Refresh data
            }
        } catch (error) {
            toast.error('Failed to process payout');
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;

    const { kpis, recentTransactions, pendingSettlements, chartData } = financeData;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <Wallet className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Revenue & Finance</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Real-time overview of platform earnings, subscriptions, and settlements.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-white px-5 py-2.5 rounded-xl border border-[#E9DFFC] text-[#27225B] text-[13px] font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                        <Download size={16} className="text-[#6B4DF1]"/> Export CSV
                    </button>
                </div>
            </div>

            {/* ── God Level KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-[#E9DFFC] transition-transform hover:-translate-y-1 relative overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#ECFDF5] rounded-full opacity-50"></div>
                    <p className="text-[13px] font-bold text-[#7D8DA6] uppercase tracking-wider mb-2 relative z-10">Total Platform Volume</p>
                    <div className="flex items-end gap-3 relative z-10">
                        <h3 className="text-[32px] font-black text-[#27225B] leading-none m-0 flex items-center"><IndianRupee size={28} className="mr-1"/>{(kpis.totalRevenue || 0).toLocaleString()}</h3>
                    </div>
                </div>

                {/* Platform Commission (Your Actual Earnings) */}
                <div className="bg-white rounded-2xl p-6 border border-[#E9DFFC] transition-transform hover:-translate-y-1 relative overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#F4F0FD] rounded-full opacity-50"></div>
                    <p className="text-[13px] font-bold text-[#7D8DA6] uppercase tracking-wider mb-2 relative z-10 flex items-center gap-1.5"><Activity size={14} className="text-[#6B4DF1]"/> SaaS Earnings (MRR)</p>
                    <div className="flex items-end gap-3 relative z-10">
                        <h3 className="text-[32px] font-black text-[#6B4DF1] leading-none m-0 flex items-center"><IndianRupee size={28} className="mr-1"/>{(kpis.mrr || 0).toLocaleString()}</h3>
                        <span className={`flex items-center text-[12px] font-bold mb-1 ${kpis.growth >= 0 ? 'text-[#10B981]' : 'text-[#E53E3E]'}`}>
                            {kpis.growth >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(kpis.growth || 0)}%
                        </span>
                    </div>
                </div>

                {/* Institute Payouts Pending */}
                <div className="bg-white rounded-2xl p-6 border border-[#E9DFFC] transition-transform hover:-translate-y-1 relative overflow-hidden" style={{ boxShadow: softShadow }}>
                    <p className="text-[13px] font-bold text-[#7D8DA6] uppercase tracking-wider mb-2 relative z-10">Pending Settlements</p>
                    <div className="flex items-end gap-3 relative z-10">
                        <h3 className="text-[32px] font-black text-[#EA580C] leading-none m-0 flex items-center"><IndianRupee size={28} className="mr-1"/>{(kpis.pendingPayouts || 0).toLocaleString()}</h3>
                    </div>
                </div>

                {/* Payment Gateway Health */}
                <div className="bg-[#27225B] rounded-2xl p-6 border border-[#1e1a48] transition-transform hover:-translate-y-1 relative overflow-hidden shadow-lg">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-[#6B4DF1] to-transparent opacity-20 rounded-bl-full"></div>
                    <p className="text-[13px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-4 relative z-10">Gateway Health</p>
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-semibold text-[14px] flex items-center gap-2"><CreditCard size={16} className="text-[#6B4DF1]"/> Stripe</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded">Connected</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white font-semibold text-[14px] flex items-center gap-2"><CreditCard size={16} className="text-[#FC8730]"/> Razorpay</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded">Connected</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Left: Recent Global Transactions ── */}
                <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#E9DFFC] flex flex-col" style={{ boxShadow: softShadow }}>
                    <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF] rounded-t-[24px] flex justify-between items-center">
                        <h2 className="text-[16px] font-black text-[#27225B] m-0">Recent Platform Transactions</h2>
                        <button className="text-[#6B4DF1] text-[12px] font-bold bg-transparent border-none cursor-pointer hover:underline">View Ledger</button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Institute / User</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider text-right">Amount</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F0FD]">
                                {recentTransactions.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-[#A0ABC0] font-medium">No transactions available yet.</td></tr>
                                ) : recentTransactions.map((trx, idx) => (
                                    <tr key={idx} className="hover:bg-[#F9F7FC] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-mono font-bold text-[#6B4DF1]">{trx.transactionId}</span>
                                            <p className="text-[10px] text-[#A0ABC0] m-0 mt-1">{new Date(trx.createdAt).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[14px] font-bold text-[#27225B]">{trx.entityName}</span>
                                            <p className="text-[11px] text-[#7D8DA6] m-0">{trx.entityEmail}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${trx.type === 'subscription' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-[#FFF7ED] text-[#EA580C]'}`}>
                                                {trx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[15px] font-black text-[#27225B]">₹{trx.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {trx.status === 'successful' ? (
                                                <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#10B981]"><CheckCircle2 size={14}/> Success</span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#E53E3E]"><AlertCircle size={14}/> Failed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Right: Pending Institute Settlements ── */}
                <div className="bg-white rounded-[24px] border border-[#E9DFFC] flex flex-col" style={{ boxShadow: softShadow }}>
                    <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF] rounded-t-[24px]">
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 flex items-center gap-2">
                            <Clock size={18} className="text-[#EA580C]"/> Pending Payouts
                        </h2>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto">
                        {pendingSettlements.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <CheckCircle2 size={40} className="text-[#D1FAE5] mb-3" />
                                <p className="text-[14px] font-bold text-[#27225B] m-0">All Settled Up!</p>
                                <p className="text-[12px] text-[#A0ABC0] m-0 mt-1">No pending payouts to institutes.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingSettlements.map((payout, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl border border-[#E9DFFC] bg-[#F9F7FC] flex items-center justify-between group hover:border-[#D5C2F6] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#E9DFFC] shadow-sm text-[#6B4DF1]">
                                                <Building2 size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-[#27225B] m-0 leading-tight">{payout.instituteName}</p>
                                                <p className="text-[11px] font-bold text-[#EA580C] m-0 mt-1">₹{payout.amount.toLocaleString()} Due</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleProcessPayout(payout.instituteId, payout.amount)}
                                            className="w-8 h-8 rounded-xl bg-white border border-[#E9DFFC] flex items-center justify-center text-[#6B4DF1] hover:bg-[#6B4DF1] hover:text-white transition-all cursor-pointer shadow-sm"
                                            title="Mark as Paid"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}