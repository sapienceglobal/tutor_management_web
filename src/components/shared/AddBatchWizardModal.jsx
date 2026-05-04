'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Search, Loader2, Users, BookOpen, GraduationCap, Calendar, User } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const GRADES = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12', 'Intermediate', 'Undergraduate', 'Postgraduate', 'Other'
];

const STEPS = [
    { id: 1, label: 'Basic Details' },
    { id: 2, label: 'Batch Instructors' },
    { id: 3, label: 'Students Add' },
    { id: 4, label: 'Review & Save' },
];

function StepIndicator({ current, steps }) {
    return (
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
            {steps.map((step, i) => {
                const visualNumber = i + 1; // Always show sequential numbers (1, 2, 3)
                const isCompleted = current > step.id;
                const isCurrent = current === step.id;

                return (
                    <div key={step.id} className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all
                                ${isCompleted ? 'bg-[#6B4DF1] text-white' :
                                    isCurrent ? 'bg-[#6B4DF1] text-white ring-4 ring-[#6B4DF1]/20' :
                                        'bg-[#E9E0FC] text-[#7D8DA6]'}`}>
                                {isCompleted ? <Check size={13} /> : visualNumber}
                            </div>
                            <span className={`text-[12px] font-bold whitespace-nowrap
                                ${current >= step.id ? 'text-[#27225B]' : 'text-[#A0ABC0]'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-px w-8 mx-1 ${isCompleted ? 'bg-[#6B4DF1]' : 'bg-[#E9E0FC]'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Step 1: Basic Details ─────────────────────────────────────────────────────
function Step1({ form, onChange, courses }) {
    return (
        <div>
            <h3 className="text-[15px] font-black text-[#27225B] mb-4">
                Basic Details <span className="text-[#E53E3E] text-[12px]">(*)</span>
            </h3>
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Enter Batch Name"
                    value={form.name}
                    onChange={e => onChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#E9E0FC] rounded-xl text-[13px] font-semibold text-[#27225B] placeholder-[#B0BEC5] outline-none focus:ring-2 focus:ring-[#6B4DF1]"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[12px] font-bold text-[#7D8DA6] mb-1.5">Course <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select
                                value={form.courseId}
                                onChange={e => onChange('courseId', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-[#E9E0FC] rounded-xl text-[13px] font-semibold text-[#27225B] outline-none focus:ring-2 focus:ring-[#6B4DF1] appearance-none cursor-pointer">
                                <option value="">- Select Course -</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#7D8DA6] pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-[#7D8DA6] mb-1.5">Grade <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select
                                value={form.grade}
                                onChange={e => onChange('grade', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-[#E9E0FC] rounded-xl text-[13px] font-semibold text-[#27225B] outline-none focus:ring-2 focus:ring-[#6B4DF1] appearance-none cursor-pointer">
                                <option value="">- Select Grade -</option>
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#7D8DA6] pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-[#7D8DA6] mb-1.5">Start Date <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={e => onChange('startDate', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-[#E9E0FC] rounded-xl text-[13px] font-semibold text-[#27225B] outline-none focus:ring-2 focus:ring-[#6B4DF1]"
                            />
                            <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8DA6] pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-[#7D8DA6] mb-1.5">End Date <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={e => onChange('endDate', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-[#E9E0FC] rounded-xl text-[13px] font-semibold text-[#27225B] outline-none focus:ring-2 focus:ring-[#6B4DF1]"
                            />
                            <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8DA6] pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Step 2: Batch Instructors ─────────────────────────────────────────────────
function Step2({ selected, onToggle, instructors }) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const filtered = instructors.filter(t =>
        (t.userId?.name || t.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.userId?.email || t.email || '').toLowerCase().includes(search.toLowerCase())
    );
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-black text-[#27225B]">
                    Select Instructors <span className="text-[#E53E3E] text-[12px]">(*)</span>
                </h3>
                <span className="text-[12px] font-bold text-[#7D8DA6]">{selected.length} Selected</span>
            </div>
            <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8DA6]" />
                <input
                    type="text"
                    placeholder="Search instructors..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E9E0FC] rounded-xl text-[13px] font-semibold text-[#27225B] placeholder-[#B0BEC5] outline-none focus:ring-2 focus:ring-[#6B4DF1]"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {paged.map(inst => {
                    const id = inst._id;
                    const name = inst.userId?.name || inst.name || 'Unknown';
                    const email = inst.userId?.email || inst.email || '';
                    const avatar = inst.userId?.profileImage || inst.profileImage;
                    const isSelected = selected.includes(id);
                    return (
                        <div key={id} onClick={() => onToggle(id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                                ${isSelected ? 'border-[#6B4DF1] bg-[#F3EEFF]' : 'border-[#E9E0FC] bg-white hover:border-[#6B4DF1]/50'}`}>
                            <div className="w-10 h-10 rounded-full bg-[#E9E0FC] overflow-hidden shrink-0 flex items-center justify-center">
                                {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> :
                                    <User size={18} className="text-[#6B4DF1]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-[#27225B] truncate">{name}</p>
                                <p className="text-[11px] font-medium text-[#7D8DA6] truncate">{email}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                                ${isSelected ? 'bg-[#6B4DF1] border-[#6B4DF1]' : 'border-[#C5C7D4]'}`}>
                                {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                            </div>
                        </div>
                    );
                })}
                {paged.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-[#A0ABC0] text-[13px] font-semibold">No instructors found</div>
                )}
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1.5 rounded-lg bg-[#E9E0FC] text-[#6B4DF1] disabled:opacity-40 cursor-pointer border-none hover:bg-[#6B4DF1] hover:text-white transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[12px] font-bold text-[#7D8DA6]">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-1.5 rounded-lg bg-[#E9E0FC] text-[#6B4DF1] disabled:opacity-40 cursor-pointer border-none hover:bg-[#6B4DF1] hover:text-white transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Step 3: Add Students ──────────────────────────────────────────────────────
function Step3({ selected, onToggle, students, batches }) {
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [page, setPage] = useState(1);
    const [gradeFilter, setGradeFilter] = useState('');
    const PER_PAGE = 10;

    const filtered = students.filter(s => {
        const name = s.name || '';
        const email = s.email || '';
        const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
        const matchGrade = !gradeFilter || s.grade === gradeFilter;
        const matchTab = tab === 'all' || selected.includes(s._id);
        return matchSearch && matchGrade && matchTab;
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const getBatchName = (studentId) => {
        const found = batches?.find(b => b.students?.some(s => s._id === studentId || s === studentId));
        return found ? found.name : 'Not in any batch';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-black text-[#27225B]">
                    Add Students <span className="text-[#E53E3E] text-[12px]">(*)</span>
                </h3>
                <span className="text-[12px] font-bold text-[#7D8DA6]">{selected.length} Selected</span>
            </div>
            <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8DA6]" />
                <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E9E0FC] rounded-xl text-[13px] font-semibold text-[#27225B] placeholder-[#B0BEC5] outline-none focus:ring-2 focus:ring-[#6B4DF1]"
                />
            </div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex bg-[#F3EEFF] rounded-xl p-1 gap-1">
                    {['all', 'selected'].map(t => (
                        <button key={t} onClick={() => { setTab(t); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border-none cursor-pointer transition-all
                                ${tab === t ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6]'}`}>
                            {t === 'all' ? 'All Students' : `Selected (${selected.length})`}
                        </button>
                    ))}
                </div>
                <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 bg-white border border-[#E9E0FC] rounded-xl text-[12px] font-bold text-[#7D8DA6] outline-none cursor-pointer">
                    <option value="">All Grades</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            {/* Table Headers */}
            <div className="grid grid-cols-[auto_1fr_1fr_1.5fr] gap-3 px-3 pb-2 border-b border-[#E9E0FC]">
                <div className="w-5" />
                <span className="text-[11px] font-bold text-[#7D8DA6]">Name</span>
                <span className="text-[11px] font-bold text-[#7D8DA6]">Grade</span>
                <span className="text-[11px] font-bold text-[#7D8DA6]">Current Batch</span>
            </div>

            <div className="space-y-2 mt-2 mb-4 max-h-64 overflow-y-auto pr-1">
                {paged.map(s => {
                    const isSelected = selected.includes(s._id);
                    const batchName = getBatchName(s._id);
                    return (
                        <div key={s._id} onClick={() => onToggle(s._id)}
                            className={`grid grid-cols-[auto_1fr_1fr_1.5fr] gap-3 items-center px-3 py-2.5 rounded-xl border cursor-pointer transition-all
                                ${isSelected ? 'border-[#6B4DF1] bg-[#F3EEFF]' : 'border-[#E9E0FC] bg-white hover:border-[#6B4DF1]/50'}`}>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
                                ${isSelected ? 'bg-[#6B4DF1] border-[#6B4DF1]' : 'border-[#C5C7D4]'}`}>
                                {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#E9E0FC] overflow-hidden shrink-0 flex items-center justify-center">
                                    {s.profileImage ? <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover" /> :
                                        <User size={14} className="text-[#6B4DF1]" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-bold text-[#27225B] truncate">{s.name}</p>
                                    <p className="text-[10px] font-medium text-[#7D8DA6] truncate">{s.email}</p>
                                </div>
                            </div>
                            <span className="text-[12px] font-semibold text-[#27225B]">{s.grade || '—'}</span>
                            <span className="text-[11px] font-medium text-[#7D8DA6] truncate">{batchName}</span>
                        </div>
                    );
                })}
                {paged.length === 0 && (
                    <div className="text-center py-8 text-[#A0ABC0] text-[13px] font-semibold">No students found</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1.5 rounded-lg bg-[#E9E0FC] text-[#6B4DF1] disabled:opacity-40 cursor-pointer border-none hover:bg-[#6B4DF1] hover:text-white transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[12px] font-bold text-[#7D8DA6]">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-1.5 rounded-lg bg-[#E9E0FC] text-[#6B4DF1] disabled:opacity-40 cursor-pointer border-none hover:bg-[#6B4DF1] hover:text-white transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Step 4: Review & Save ─────────────────────────────────────────────────────
function Step4({ form, selectedInstructors, selectedStudents, instructors, students, courses, page, setPage, role }) {
    const course = courses.find(c => c._id === form.courseId);
    const selInst = instructors.filter(t => selectedInstructors.includes(t._id));
    const selStu = students.filter(s => selectedStudents.includes(s._id));
    const PER = 6;

    const instPages = Math.ceil(selInst.length / PER);
    const stuPages = Math.ceil(selStu.length / PER);
    const pagedInst = selInst.slice((page - 1) * PER, page * PER);
    const pagedStu = selStu.slice((page - 1) * PER, page * PER);

    return (
        <div>
            <h3 className="text-[15px] font-black text-[#27225B] mb-4">Review & Save</h3>
            <div className="bg-[#F3EEFF] rounded-2xl p-4 mb-4 border border-[#E9E0FC]">
                <h4 className="text-[13px] font-black text-[#27225B] mb-3">Batch Details</h4>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: Check, label: form.name },
                        { icon: BookOpen, label: course?.title || '—' },
                        { icon: GraduationCap, label: `Grade: ${form.grade || '—'}` },
                        { icon: Calendar, label: `Start Date: ${form.startDate || '—'}` },
                        { icon: X, label: `End Date: ${form.endDate || '—'}` },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5">
                            <div className="w-5 h-5 bg-[#E9E0FC] rounded flex items-center justify-center shrink-0">
                                <item.icon size={11} className="text-[#6B4DF1]" strokeWidth={3} />
                            </div>
                            <span className="text-[12px] font-semibold text-[#27225B] truncate">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

          <div className={`grid grid-cols-1 ${role === 'admin' ? 'sm:grid-cols-2' : ''} gap-4`}>
                {role === 'admin' && (
                    <div>
                        <h4 className="text-[13px] font-black text-[#27225B] mb-3">Assigned Instructors</h4>
                        <div className="space-y-2">
                            {pagedInst.map(inst => {
                                const name = inst.userId?.name || inst.name || 'Unknown';
                                const email = inst.userId?.email || inst.email || '';
                                const avatar = inst.userId?.profileImage || inst.profileImage;
                                return (
                                    <div key={inst._id} className="flex items-center gap-2.5 bg-[#F3EEFF] rounded-xl px-3 py-2">
                                        <div className="w-8 h-8 rounded-full bg-[#E9E0FC] overflow-hidden shrink-0 flex items-center justify-center">
                                            {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> :
                                                <User size={14} className="text-[#6B4DF1]" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-bold text-[#27225B] truncate">{name}</p>
                                            <p className="text-[10px] text-[#7D8DA6] truncate">{email}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {selInst.length === 0 && <p className="text-[12px] text-[#A0ABC0] font-medium">No instructors selected</p>}
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="text-[13px] font-black text-[#27225B] mb-3">Assigned Students</h4>
                    <div className="space-y-2">
                        {pagedStu.map(s => (
                            <div key={s._id} className="flex items-center gap-2.5 bg-[#F3EEFF] rounded-xl px-3 py-2">
                                <div className="w-8 h-8 rounded-full bg-[#E9E0FC] overflow-hidden shrink-0 flex items-center justify-center">
                                    {s.profileImage ? <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover" /> :
                                        <User size={14} className="text-[#6B4DF1]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-[#27225B] truncate">{s.name}</p>
                                    <p className="text-[10px] text-[#7D8DA6] truncate">{s.email}</p>
                                </div>
                                <div className="w-5 h-5 rounded bg-[#6B4DF1] flex items-center justify-center shrink-0">
                                    <Check size={11} color="white" strokeWidth={3} />
                                </div>
                            </div>
                        ))}
                        {selStu.length === 0 && <p className="text-[12px] text-[#A0ABC0] font-medium">No students selected</p>}
                    </div>
                </div>
            </div>

            {(instPages > 1 || stuPages > 1) && (
                <div className="flex items-center justify-center gap-3 mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1.5 rounded-lg bg-[#E9E0FC] text-[#6B4DF1] disabled:opacity-40 cursor-pointer border-none hover:bg-[#6B4DF1] hover:text-white transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[12px] font-bold text-[#7D8DA6]">{page} / {Math.max(instPages, stuPages)}</span>
                    <button onClick={() => setPage(p => Math.min(Math.max(instPages, stuPages), p + 1))} disabled={page === Math.max(instPages, stuPages)}
                        className="p-1.5 rounded-lg bg-[#E9E0FC] text-[#6B4DF1] disabled:opacity-40 cursor-pointer border-none hover:bg-[#6B4DF1] hover:text-white transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AddBatchWizardModal({ onClose, onSuccess, initialData = null, role = 'admin' }) {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [reviewPage, setReviewPage] = useState(1);

    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        name: initialData?.name || '',
        courseId: initialData?.courseId?._id || initialData?.courseId || '',
        grade: initialData?.grade || '',
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
    });
    const [selectedInstructors, setSelectedInstructors] = useState(
        initialData?.instructors?.map(i => i._id || i) || []
    );
    const [selectedStudents, setSelectedStudents] = useState(
        initialData?.students?.map(s => s._id || s) || []
    );

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [courseRes, studentsRes, batchesRes] = await Promise.all([
                    role === 'admin' ? api.get('/admin/courses') : api.get('/courses/my-courses'),
                    role === 'admin' ? api.get('/admin/students') : api.get('/tutor/dashboard/students'),
                    api.get('/batches'),
                ]);

                if (courseRes?.data?.success) setCourses(courseRes.data.courses || []);
                if (studentsRes?.data?.success) setStudents(studentsRes.data.students || []);
                if (batchesRes?.data?.success) setBatches(batchesRes.data.batches || []);

                // Fetch instructors differently by role
                if (role === 'admin') {
                    const tutRes = await api.get('/admin/tutors');
                    if (tutRes.data.success) setInstructors(tutRes.data.tutors || []);
                } else {
                    const tutRes = await api.get('/tutors');
                    if (tutRes.data.success) setInstructors(tutRes.data.tutors || tutRes.data.data || []);
                }
            } catch (err) {
                console.error('Error loading batch form data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [role]);

    const handleFormChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const toggleInstructor = useCallback((id) => {
        setSelectedInstructors(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const toggleStudent = useCallback((id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);
    const activeSteps = role === 'admin'
        ? [
            { id: 1, label: 'Basic Details' },
            { id: 2, label: 'Batch Instructors' },
            { id: 3, label: 'Students Add' },
            { id: 4, label: 'Review & Save' },
        ]
        : [
            { id: 1, label: 'Basic Details' },
            { id: 3, label: 'Students Add' },
            { id: 4, label: 'Review & Save' },
        ];
    const validateStep = () => {
        if (step === 1) {
            if (!form.name.trim()) { toast.error('Batch name is required'); return false; }
            if (!form.courseId) { toast.error('Please select a course'); return false; }
            if (!form.grade) { toast.error('Please select a grade'); return false; }
            if (!form.startDate) { toast.error('Start date is required'); return false; }
            if (!form.endDate) { toast.error('End date is required'); return false; }
        }
        if (step === 2) {
            if (selectedInstructors.length === 0) { toast.error('Please select at least one instructor'); return false; }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (role === 'tutor' && step === 1) setStep(3); // Jump to students
        else setStep(s => Math.min(4, s + 1));
    };

    const handleBack = () => {
        if (role === 'tutor' && step === 3) setStep(1); // Jump back to details
        else setStep(s => Math.max(1, s - 1));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                instructors: selectedInstructors,
                students: selectedStudents,
                tutorId: selectedInstructors[0] || undefined,
            };

            let res;
            if (initialData) {
                res = await api.put(`/batches/${initialData._id}`, payload);
            } else {
                res = await api.post('/batches', payload);
            }

            if (res.data.success) {
                toast.success(initialData ? 'Batch updated successfully!' : 'Batch created successfully!');
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save batch');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(21,22,86,0.4)', backdropFilter: 'blur(6px)' }}>
                <div className="bg-white rounded-3xl p-10 flex flex-col items-center gap-3 shadow-2xl">
                    <Loader2 className="animate-spin text-[#6B4DF1] w-8 h-8" />
                    <p className="text-[13px] font-bold text-[#7D8DA6]">Loading batch data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21,22,86,0.4)', backdropFilter: 'blur(6px)' }}>
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-2">
                    <h2 className="text-[18px] font-black text-[#27225B]">
                        {initialData ? 'Edit Batch' : 'Add Batch'}
                    </h2>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3EEFF] border-none cursor-pointer hover:bg-[#E9E0FC] transition-colors">
                        <X size={16} className="text-[#27225B]" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-7 pt-4">
                    <StepIndicator current={step} steps={activeSteps} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-7 pb-4">
                    {step === 1 && <Step1 form={form} onChange={handleFormChange} courses={courses} />}
                    {step === 2 && role === 'admin' && <Step2 selected={selectedInstructors} onToggle={toggleInstructor} instructors={instructors} />}
                    {step === 3 && <Step3 selected={selectedStudents} onToggle={toggleStudent} students={students} batches={batches} />}
                    {step === 4 && (
                        <Step4
                            form={form}
                            selectedInstructors={selectedInstructors}
                            selectedStudents={selectedStudents}
                            instructors={instructors}
                            students={students}
                            courses={courses}
                            page={reviewPage}
                            setPage={setReviewPage}
                            role={role} // Pass role here
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-7 py-5 flex items-center justify-between border-t border-[#F0EBFF]">
                    <button onClick={step === 1 ? onClose : handleBack}
                        className="px-6 py-2.5 rounded-xl border border-[#E9E0FC] text-[#7D8DA6] text-[13px] font-bold bg-white cursor-pointer hover:bg-[#F3EEFF] transition-colors">
                        {step === 1 ? 'Cancel' : '← Back'}
                    </button>
                    <div className="flex items-center gap-3">
                        {step < 4 ? (
                            <button onClick={handleNext}
                                className="px-6 py-2.5 rounded-xl text-white text-[13px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ background: 'linear-gradient(135deg, #6B4DF1 0%, #9B7CF4 100%)' }}>
                                Next
                            </button>
                        ) : (
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-60 transition-opacity"
                                style={{ background: 'linear-gradient(135deg, #6B4DF1 0%, #9B7CF4 100%)' }}>
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                Save Batch
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
