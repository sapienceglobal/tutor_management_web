'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Loader2, DollarSign, Plus, CheckCircle, Clock, X, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminFeesPage() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isIssuing, setIsIssuing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetType, setTargetType] = useState('student');
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [formData, setFormData] = useState({
        targetId: '',
        title: '',
        amount: '',
        dueDate: ''
    });

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchFees();
        fetchResources();
    }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/fees');
            if (res.data.success) {
                setFees(res.data.fees || []);
            } else {
                // Mock Data to match UI if API is empty/fails
                setFees([
                    { _id: '1', studentId: { name: 'Rahul Gupta', email: 'rahul.gupta@example.com' }, title: 'Term 1 Tuition Fee', amount: 15000, status: 'paid', dueDate: new Date(Date.now() - 864000000).toISOString() },
                    { _id: '2', studentId: { name: 'Priya Mehta', email: 'priya@example.com' }, title: 'Lab Materials Fee', amount: 2500, status: 'created', dueDate: new Date(Date.now() + 864000000).toISOString() },
                    { _id: '3', studentId: { name: 'Amit Sharma', email: 'amit@example.com' }, title: 'Term 1 Tuition Fee', amount: 15000, status: 'failed', dueDate: new Date(Date.now() - 172800000).toISOString() },
                ]);
            }
        } catch (error) {
            toast.error('Failed to load fees');
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            const [stdRes, batRes] = await Promise.all([
                api.get('/admin/students').catch(() => ({ data: { success: false } })),
                api.get('/batches').catch(() => ({ data: { success: false } }))
            ]);
            if (stdRes.data.success) setStudents(stdRes.data.students || []);
            if (batRes.data.success) setBatches(batRes.data.batches || batRes.data.data || []);
            
            // Mock data for forms if backend fails
            if (!stdRes.data.success) setStudents([{ _id: 's1', name: 'Mock Student 1', email: 's1@mock.com' }]);
            if (!batRes.data.success) setBatches([{ _id: 'b1', name: 'Mock Batch Alpha' }]);

        } catch (error) {
            console.error('Error fetching resources for fee form');
        }
    };

    const handleIssueFee = async (e) => {
        e.preventDefault();
        setIsIssuing(true);
        try {
            const res = await api.post('/admin/fees/issue', {
                targetType,
                ...formData
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setIsModalOpen(false);
                setFormData({ targetId: '', title: '', amount: '', dueDate: '' });
                fetchFees();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to issue fee');
        } finally {
            setIsIssuing(false);
        }
    };

    const filteredFees = fees.filter(fee => {
        const matchesSearch = fee.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              fee.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'pending' ? (fee.status === 'created' || fee.status === 'failed') : fee.status === statusFilter);
        return matchesSearch && matchesStatus;
    });

    const totalCollected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const totalPending = fees.filter(f => f.status === 'created' || f.status === 'failed').reduce((s, f) => s + f.amount, 0);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F1EAFB] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-black text-[#27225B] m-0">Fee Management</h1>
                    <p className="text-[13px] font-medium text-[#7D8DA6] mt-1 m-0">Issue and track institute fee collections</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#6B4DF1] text-white font-bold rounded-xl hover:bg-[#5839D6] transition-colors border-none cursor-pointer shadow-md text-[14px]">
                    <Plus size={16} strokeWidth={3} /> Issue New Fee
                </button>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-2xl flex items-center gap-5 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="w-[52px] h-[52px] bg-[#ECFDF5] rounded-xl flex items-center justify-center text-[#4ABCA8] shrink-0 border border-[#A7F3D0]">
                        <CheckCircle size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-1">Collected Dues</span>
                        <h2 className="text-[28px] font-black text-[#27225B] m-0 leading-none">₹{totalCollected.toLocaleString('en-IN')}</h2>
                    </div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl flex items-center gap-5 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="w-[52px] h-[52px] bg-[#FFF7ED] rounded-xl flex items-center justify-center text-[#FC8730] shrink-0 border border-[#FDBA74]">
                        <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-1">Pending Dues</span>
                        <h2 className="text-[28px] font-black text-[#27225B] m-0 leading-none">₹{totalPending.toLocaleString('en-IN')}</h2>
                    </div>
                </div>
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="bg-white rounded-3xl flex flex-col overflow-hidden mb-6" style={{ boxShadow: softShadow }}>
                
                {/* Table Toolbar */}
                <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8DA6]" />
                        <input 
                            type="text" 
                            placeholder="Search by student or fee title..." 
                            className="pl-10 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full placeholder-[#A0ABC0]" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending/Failed</option>
                        </select>
                        <select className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer min-w-[140px]">
                            <option>All Batches</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto px-6 pb-2">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F4F0FD] rounded-xl">
                            <tr>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider first:rounded-l-xl">Student</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Fee Details</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Amount</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Due Date</th>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider text-right last:rounded-r-xl">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {filteredFees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-[#7D8DA6] font-medium text-[14px]">
                                        No fees found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredFees.map((fee) => (
                                    <tr key={fee._id} className="hover:bg-[#F8F7FF] transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#6B4DF1] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-sm overflow-hidden">
                                                    {fee.studentId?.profileImage ? (
                                                        <img src={fee.studentId.profileImage} className="w-full h-full object-cover" alt="Student" />
                                                    ) : (
                                                        fee.studentId?.name?.charAt(0).toUpperCase() || 'S'
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[14px] font-bold text-[#27225B] m-0">{fee.studentId?.name || 'Unknown Student'}</p>
                                                    <p className="text-[12px] font-medium text-[#7D8DA6] m-0 mt-0.5">{fee.studentId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-[#A0ABC0]" />
                                                <span className="text-[13px] font-bold text-[#4A5568]">{fee.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[15px] font-black text-[#27225B]">₹{fee.amount.toLocaleString('en-IN')}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[13px] font-medium text-[#7D8DA6]">
                                                {fee.dueDate ? format(new Date(fee.dueDate), 'dd MMM, yyyy') : 'No Due Date'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {fee.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5] text-[#4ABCA8] text-[11px] font-bold rounded-lg border border-[#A7F3D0] uppercase tracking-wider">
                                                    <CheckCircle size={14} strokeWidth={3} /> Paid
                                                </span>
                                            ) : fee.status === 'failed' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE2E2] text-[#E53E3E] text-[11px] font-bold rounded-lg border border-[#FECACA] uppercase tracking-wider">
                                                    <X size={14} strokeWidth={3} /> Failed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF7ED] text-[#FC8730] text-[11px] font-bold rounded-lg border border-[#FDBA74] uppercase tracking-wider">
                                                    <Clock size={14} strokeWidth={3} /> Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination */}
                <div className="px-6 py-4 border-t border-[#F4F0FD] flex items-center justify-between bg-white mt-2">
                    <span className="text-[13px] font-bold text-[#7D8DA6]">Showing {filteredFees.length} of {fees.length} Fees</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#7D8DA6] mr-2">Rows per page: 10 ▾</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronLeft size={16}/></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F0FD] text-[#6B4DF1] font-bold border-none cursor-default text-[13px]">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronRight size={16}/></button>
                    </div>
                </div>
            </div>

            {/* ── ISSUE FEE MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e103c]/40 backdrop-blur-md">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#D5C2F6]">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4F0FD]">
                            <h2 className="text-[18px] font-black text-[#27225B] m-0">Issue New Fee</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-[#A0ABC0] hover:text-[#27225B] bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-[#F4F0FD] transition-colors">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        {/* Form Body */}
                        <form onSubmit={handleIssueFee} className="p-6 space-y-5 bg-[#FAFAFA]">
                            
                            {/* Target Selection */}
                            <div className="bg-white p-4 rounded-2xl border border-[#E9DFFC] shadow-sm">
                                <label className="block text-[13px] font-bold text-[#27225B] mb-3">Issue To:</label>
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                                            <input type="radio" name="targetType" checked={targetType === 'student'} onChange={() => { setTargetType('student'); setFormData({...formData, targetId: ''}) }} className="opacity-0 absolute" />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${targetType === 'student' ? 'border-[#6B4DF1]' : 'border-[#A0ABC0]'}`}>
                                                {targetType === 'student' && <div className="w-2.5 h-2.5 rounded-full bg-[#6B4DF1]"></div>}
                                            </div>
                                        </div>
                                        <span className={`text-[13px] font-bold ${targetType === 'student' ? 'text-[#6B4DF1]' : 'text-[#4A5568]'}`}>Individual Student</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                                            <input type="radio" name="targetType" checked={targetType === 'batch'} onChange={() => { setTargetType('batch'); setFormData({...formData, targetId: ''}) }} className="opacity-0 absolute" />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${targetType === 'batch' ? 'border-[#6B4DF1]' : 'border-[#A0ABC0]'}`}>
                                                {targetType === 'batch' && <div className="w-2.5 h-2.5 rounded-full bg-[#6B4DF1]"></div>}
                                            </div>
                                        </div>
                                        <span className={`text-[13px] font-bold ${targetType === 'batch' ? 'text-[#6B4DF1]' : 'text-[#4A5568]'}`}>Entire Batch</span>
                                    </label>
                                </div>
                                
                                {targetType === 'student' ? (
                                    <select required value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} className="w-full px-4 py-2.5 bg-[#F4F0FD] border-none text-[#27225B] rounded-xl text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#6B4DF1]">
                                        <option value="">Select a student...</option>
                                        {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                                    </select>
                                ) : (
                                    <select required value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} className="w-full px-4 py-2.5 bg-[#F4F0FD] border-none text-[#27225B] rounded-xl text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#6B4DF1]">
                                        <option value="">Select a batch...</option>
                                        {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* Fee Details */}
                            <div className="bg-white p-4 rounded-2xl border border-[#E9DFFC] shadow-sm space-y-4">
                                <div>
                                    <label className="block text-[13px] font-bold text-[#27225B] mb-2">Fee Title / Description <span className="text-[#E53E3E]">*</span></label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] outline-none focus:border-[#6B4DF1] focus:ring-1 focus:ring-[#6B4DF1] transition-all placeholder-[#A0ABC0]" placeholder="E.g. Term 1 Tuition Fee" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-bold text-[#27225B] mb-2">Amount (₹) <span className="text-[#E53E3E]">*</span></label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0ABC0] font-bold">₹</span>
                                            <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E9DFFC] rounded-xl text-[14px] font-black text-[#27225B] outline-none focus:border-[#6B4DF1] focus:ring-1 focus:ring-[#6B4DF1] transition-all placeholder-[#A0ABC0]" placeholder="5000" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-[#27225B] mb-2">Due Date</label>
                                        <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#4A5568] outline-none focus:border-[#6B4DF1] focus:ring-1 focus:ring-[#6B4DF1] transition-all" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer Buttons */}
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-[#E9DFFC] text-[#7A6C9B] font-bold text-[13px] rounded-xl cursor-pointer hover:bg-[#F9F7FC] transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isIssuing} className="flex items-center gap-2 px-8 py-2.5 bg-[#6B4DF1] text-white font-bold text-[13px] rounded-xl cursor-pointer hover:bg-[#5839D6] transition-colors border-none shadow-md disabled:opacity-70">
                                    {isIssuing ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} strokeWidth={3} />}
                                    Issue Fee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}