'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, Download, MoreHorizontal, ChevronDown, CheckCircle2, 
    XCircle, ChevronLeft, ChevronRight, TrendingUp, Building2, 
    FileText, ArrowRightCircle, Plus, Copy, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios'; // Use your custom API interceptor if you have one
import { getSubscriptionsOverview } from '@/services/superadminService';

export default function SubscriptionsDashboard() {
    const [selectedRows, setSelectedRows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Dynamic States for API Data
    const [subscriptions, setSubscriptions] = useState([]);
    const [kpis, setKpis] = useState({ totalSubscriptions: 0, monthlyRevenue: 0, newThisMonth: 0 });
    const [distribution, setDistribution] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

   const fetchDashboardData = async () => {
        try {
            // Seedha service function call kiya, token handling api interceptor khud dekh lega
            const data = await getSubscriptionsOverview();

            if (data.success) {
                setSubscriptions(data.subscriptions);
                setKpis(data.kpis);
                setDistribution(data.distribution);
            }
        } catch (error) {
            // Error message service file se normalize ho kar aayega
            toast.error(error.message || 'Failed to load subscriptions data');
            console.error('Dashboard Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const toggleAll = () => {
        if (selectedRows.length === subscriptions.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(subscriptions.map(s => s.id));
        }
    };

    const getPlanBadge = (plan) => {
        const lower = plan.toLowerCase();
        if (lower.includes('basic')) return 'bg-[#EEF2FF] text-[#6B4DF1]';
        if (lower.includes('pro')) return 'bg-[#F3E8FF] text-[#9333EA]';
        if (lower.includes('enterprise')) return 'bg-[#FFF7ED] text-[#F97316]';
        return 'bg-gray-100 text-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F8F6FC]">
                <Loader2 className="w-10 h-10 animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-8 bg-[#F8F6FC] font-sans">
            
            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-[26px] font-bold text-[#2D235C] m-0">Total Subscriptions</h1>
                <p className="text-[14px] text-[#7A7599] m-0 mt-1">Track and manage all subscriptions across institutes.</p>
            </div>

            {/* ── KPI Cards (REAL DATA) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p className="text-[14px] font-medium text-[#7A7599]">Total Subscriptions</p>
                        <h3 className="text-[24px] font-bold text-[#2D235C] leading-none mt-1">
                            {kpis.totalSubscriptions.toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[14px] font-medium text-[#7A7599]">Monthly Revenue</p>
                        <h3 className="text-[24px] font-bold text-[#2D235C] leading-none mt-1">
                            ₹{kpis.monthlyRevenue.toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                        <Plus size={24} />
                    </div>
                    <div>
                        <p className="text-[14px] font-medium text-[#7A7599]">New Subscriptions (This Month)</p>
                        <h3 className="text-[24px] font-bold text-[#2D235C] leading-none mt-1">
                            {kpis.newThisMonth.toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            {/* ── Main Layout: Table Area (Left) + Sidebar (Right) ── */}
            <div className="flex flex-col xl:flex-row gap-6">
                
                {/* ── Left Area: Table ── */}
                <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-purple-50 overflow-hidden flex flex-col">
                    
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition">
                                <CheckCircle2 size={16} className="text-[#8B5CF6]"/> Approve
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#F3E8FF] text-[#8B5CF6] rounded-lg text-[13px] font-semibold hover:bg-[#E9D5FF] transition">
                                <Download size={16} /> Export <ChevronDown size={14}/>
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search subscriptions..." 
                                    className="bg-[#F8F6FC] pl-9 pr-4 py-2 rounded-lg text-[13px] border-none focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 w-[250px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 px-6 w-12"><input type="checkbox" className="rounded text-[#8B5CF6] focus:ring-[#8B5CF6] w-4 h-4 cursor-pointer" onChange={toggleAll} checked={selectedRows.length === subscriptions.length && subscriptions.length > 0} /></th>
                                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">Institute Name / ID</th>
                                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">Subscription Plan</th>
                                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">Students</th>
                                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">Revenue</th>
                                    <th className="py-4 px-4 text-[13px] font-semibold text-gray-500">Start Date</th>
                                    <th className="py-4 px-6 text-[13px] font-semibold text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((sub) => (
                                    <tr key={sub.id} className={`border-b border-gray-50 hover:bg-[#F8F6FC]/50 transition-colors ${selectedRows.includes(sub.id) ? 'bg-[#F8F6FC]' : ''}`}>
                                        <td className="py-3 px-6">
                                            <input type="checkbox" className="rounded text-[#8B5CF6] focus:ring-[#8B5CF6] w-4 h-4 cursor-pointer" checked={selectedRows.includes(sub.id)} onChange={() => toggleRow(sub.id)} />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-[#2D235C] leading-tight">{sub.name}</p>
                                                    <p className="text-[12px] text-gray-400 font-medium">{sub.displayId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded text-[12px] font-bold ${getPlanBadge(sub.plan)}`}>{sub.plan}</span>
                                        </td>
                                        <td className="py-3 px-4 text-[14px] font-medium text-gray-700">{sub.students.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-[14px] font-bold text-[#2D235C]">₹{sub.revenue.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-[13px] font-medium text-gray-500">{sub.date}</td>
                                        <td className="py-3 px-6">
                                            {sub.status === 'Active' ? (
                                                <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md bg-[#DCFCE7] text-[#16A34A] text-[12px] font-bold">
                                                    <CheckCircle2 size={14} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md bg-[#FEE2E2] text-[#DC2626] text-[12px] font-bold">
                                                    <XCircle size={14} /> Expired
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Right Area: Sidebar Charts & Info (REAL DATA) ── */}
                <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6">
                    
                    {/* Plan Distribution Chart Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-purple-50">
                        <h3 className="text-[16px] font-bold text-[#2D235C] mb-6">Plan Distribution</h3>
                        <div className="flex flex-col items-center">
                            {/* Dynamic Legend List based on API Data */}
                            <div className="w-full space-y-3 mt-4">
                                {distribution.length > 0 ? distribution.map((item, idx) => {
                                    // Assign colors based on plan name dynamically
                                    let dotColor = "bg-gray-300";
                                    if (item.name.toLowerCase().includes('basic')) dotColor = "bg-[#93C5FD]";
                                    else if (item.name.toLowerCase().includes('pro')) dotColor = "bg-[#A78BFA]";
                                    else if (item.name.toLowerCase().includes('enterprise')) dotColor = "bg-[#FBBF24]";
                                    
                                    return (
                                        <div key={idx} className="flex items-center justify-between text-[13px] font-medium">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span className={`w-3 h-3 rounded-full ${dotColor}`}></span> {item.name}
                                            </div>
                                            <span className="text-[#2D235C] font-bold">{item.percentage}%</span>
                                        </div>
                                    )
                                }) : <p className="text-sm text-gray-400 text-center">No active plans data</p>}
                            </div>
                        </div>
                    </div>

                    {/* Revenue Overview Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-purple-50">
                        <h3 className="text-[16px] font-bold text-[#2D235C] mb-4">Revenue Overview</h3>
                        <div className="bg-[#F8F6FC] rounded-xl p-4 border border-purple-100 mb-5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[13px] text-gray-500 font-medium">This Month</span>
                                <span className="text-[16px] font-bold text-[#2D235C]">₹{kpis.monthlyRevenue.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F8F6FC] rounded-xl text-[14px] font-semibold text-[#2D235C] transition group border border-transparent hover:border-purple-100">
                                <div className="w-8 h-8 rounded-full bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center group-hover:bg-[#8B5CF6] group-hover:text-white transition">
                                    <Copy size={16} />
                                </div>
                                Export Subscriptions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}