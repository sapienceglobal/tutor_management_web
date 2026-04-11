'use client';

import { useState } from 'react';
import {
    X, Check, ChevronRight, ChevronLeft, Loader2,
    Building2, MapPin, User, Mail, Phone, Globe, FileText, Tag, Plus
} from 'lucide-react';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];

const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
    'Kolkata', 'Pune', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
    'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
    'Rajkot', 'Kalyan', 'Vasai', 'Varanasi', 'Srinagar', 'Aurangabad',
    'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah',
    'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
    'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur', 'Hubli', 'Mysore'
];

const DEFAULT_CATEGORIES = ['Engineering', 'Management', 'Arts & Science', 'Medical', 'Others'];

const STEPS = [
    { id: 1, label: 'Branch Details' },
    { id: 2, label: 'Contact Information' },
    { id: 3, label: 'Categories' },
    { id: 4, label: 'Review & Save' },
];

const inputCls = "w-full px-4 py-3 bg-white border border-[#E4DAFC] rounded-xl text-[13px] font-semibold text-[#27225B] placeholder-[#B0BEC5] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all";
const labelCls = "flex items-center gap-2 text-[13px] font-black text-[#27225B] mb-2";

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
    return (
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 flex-nowrap">
            {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all
                            ${current > step.id ? 'bg-[#6B4DF1] text-white' :
                              current === step.id ? 'bg-[#6B4DF1] text-white ring-4 ring-[#6B4DF1]/20' :
                              'bg-[#EDE8FB] text-[#A0ABC0]'}`}>
                            {current > step.id ? <Check size={12} strokeWidth={3} /> : step.id}
                        </div>
                        <span className={`text-[12px] font-bold whitespace-nowrap transition-all
                            ${current >= step.id ? 'text-[#27225B]' : 'text-[#A0ABC0]'}`}>
                            {step.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`h-px w-6 mx-1 transition-all ${current > step.id ? 'bg-[#6B4DF1]' : 'bg-[#E4DAFC]'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Step 1: Branch Details ────────────────────────────────────────────────────
function Step1({ form, onChange }) {
    return (
        <div className="space-y-4">
            {/* Branch Name */}
            <div>
                <label className={labelCls}><Building2 size={15} className="text-[#6B4DF1]" /> Branch Name</label>
                <input type="text" className={inputCls} placeholder="Branch Name"
                    value={form.campusName} onChange={e => onChange('campusName', e.target.value)} />
            </div>

            {/* Branch Code */}
            <div>
                <label className={labelCls}><Building2 size={15} className="text-[#6B4DF1]" /> Branch Code <span className="text-[11px] font-medium text-[#A0ABC0]">(optional)</span></label>
                <input type="text" className={inputCls} placeholder="Address"
                    value={form.branchCode} onChange={e => onChange('branchCode', e.target.value)} />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}><MapPin size={15} className="text-[#6B4DF1]" /> City</label>
                    <div className="relative">
                        <select value={form.city} onChange={e => onChange('city', e.target.value)}
                            className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                            <option value="">City</option>
                            {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#7D8DA6] pointer-events-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-[13px] font-black text-[#27225B] mb-2 opacity-0">State</label>
                    <div className="relative">
                        <select value={form.state} onChange={e => onChange('state', e.target.value)}
                            className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                            <option value="">State (optional)</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#7D8DA6] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Pincode */}
            <div>
                <label className={labelCls}><MapPin size={15} className="text-[#6B4DF1]" /> Pincode</label>
                <input type="text" className={inputCls} placeholder="Zip Code"
                    value={form.zipCode} onChange={e => onChange('zipCode', e.target.value)} />
            </div>
        </div>
    );
}

// ── Step 2: Contact Information ───────────────────────────────────────────────
function Step2({ form, onChange }) {
    return (
        <div className="space-y-4">
            <div>
                <label className={labelCls}><User size={15} className="text-[#6B4DF1]" /> Contact Information</label>
                <input type="text" className={inputCls} placeholder="Contact Person"
                    value={form.contactPerson} onChange={e => onChange('contactPerson', e.target.value)} />
            </div>
            <div>
                <label className={labelCls}><Mail size={15} className="text-[#6B4DF1]" /> Contact Email</label>
                <input type="email" className={inputCls} placeholder="Contact Email"
                    value={form.contactEmail} onChange={e => onChange('contactEmail', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}><Phone size={15} className="text-[#6B4DF1]" /> Contact Phone</label>
                    <input type="tel" className={inputCls} placeholder="Phone number"
                        value={form.contactPhone} onChange={e => onChange('contactPhone', e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}><Phone size={15} className="text-[#6B4DF1]" /> Alternate Phone <span className="text-[11px] font-medium text-[#A0ABC0]">(optional)</span></label>
                    <div className="relative">
                        <select value={form.alternatePhone} onChange={e => onChange('alternatePhone', e.target.value)}
                            className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                            <option value="">(optional)</option>
                        </select>
                        <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#7D8DA6] pointer-events-none" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}><Globe size={15} className="text-[#6B4DF1]" /> Branch Website <span className="text-[11px] font-medium text-[#A0ABC0]">(optional)</span></label>
                    <input type="url" className={inputCls} placeholder="https://www."
                        value={form.website} onChange={e => onChange('website', e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}><FileText size={15} className="text-[#6B4DF1]" /> Custom Notes <span className="text-[11px] font-medium text-[#A0ABC0]">(optional)</span></label>
                    <textarea rows={3} className={inputCls} placeholder="Any additional notes..."
                        value={form.notes} onChange={e => onChange('notes', e.target.value)} style={{ resize: 'vertical', minHeight: '80px' }} />
                </div>
            </div>
        </div>
    );
}

// ── Step 3: Categories ────────────────────────────────────────────────────────
function Step3({ selected, onToggle, customCategories, setCustomCategories }) {
    const [newCat, setNewCat] = useState('');
    const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

    const addCustom = () => {
        const trimmed = newCat.trim();
        if (!trimmed || allCategories.includes(trimmed)) return;
        setCustomCategories(prev => [...prev, trimmed]);
        setNewCat('');
    };

    return (
        <div>
            <div className="mb-4">
                <label className={labelCls}><Tag size={15} className="text-[#6B4DF1]" /> Categories</label>
                <div className="flex items-center gap-2 mb-3">
                    <ChevronRight size={14} className="text-[#6B4DF1]" />
                    <span className="text-[13px] font-bold text-[#27225B]">Select Categories</span>
                </div>
            </div>

            <div className="border border-[#E4DAFC] rounded-xl overflow-hidden mb-4">
                {allCategories.map((cat, i) => {
                    const isChecked = selected.includes(cat);
                    return (
                        <div key={cat} onClick={() => onToggle(cat)}
                            className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors
                                ${i < allCategories.length - 1 ? 'border-b border-[#F0EBFF]' : ''}
                                ${isChecked ? 'bg-[#F3EEFF]' : 'bg-white hover:bg-[#FAF7FF]'}`}>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
                                ${isChecked ? 'bg-[#6B4DF1] border-[#6B4DF1]' : 'border-[#C5C7D4] bg-white'}`}>
                                {isChecked && <Check size={11} color="white" strokeWidth={3} />}
                            </div>
                            <span className="text-[13px] font-semibold text-[#27225B]">{cat}</span>
                        </div>
                    );
                })}
            </div>

            {/* Add Custom Category */}
            <div>
                <label className="block text-[13px] font-black text-[#27225B] mb-2">Add Custom Category</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustom()}
                        placeholder="Add category..."
                        className={`${inputCls} flex-1`}
                    />
                    <button onClick={addCustom}
                        className="w-10 h-[46px] rounded-xl bg-[#6B4DF1] text-white border-none cursor-pointer flex items-center justify-center hover:bg-[#5839D6] transition-colors shrink-0">
                        <Plus size={16} strokeWidth={3} />
                    </button>
                </div>
                <p className="text-[11px] font-medium text-[#A0ABC0] mt-2">You can select multiple categories for your branch.</p>
            </div>
        </div>
    );
}

// ── Step 4: Review & Save ────────────────────────────────────────────────────
function Step4({ form, selected }) {
    const rows = [
        { label: 'Branch Name', value: form.campusName },
        { label: 'Branch Code', value: form.branchCode || '—' },
        { label: 'Address', value: form.branchCode || '—' },
        { label: 'City', value: form.city || '—' },
        { label: 'State', value: form.state || '—' },
        { label: 'Pincode', value: form.zipCode || '—' },
        { label: 'Contact Person', value: form.contactPerson || '—' },
        { label: 'Contact Email', value: form.contactEmail || '—' },
        { label: 'Contact Phone', value: form.contactPhone || '—' },
        { label: 'Alternate Phone', value: form.alternatePhone || '—' },
        { label: 'Branch Website', value: form.website || '—' },
        { label: 'Custom Notes', value: selected.join(', ') || '—' },
    ];

    return (
        <div>
            <h3 className="text-[15px] font-black text-[#27225B] mb-4">Review & Save</h3>
            <div className="border border-[#E4DAFC] rounded-2xl overflow-hidden">
                <div className="bg-[#F3EEFF] px-4 py-3 border-b border-[#E4DAFC]">
                    <h4 className="text-[13px] font-black text-[#27225B] m-0">Branch Summary</h4>
                </div>
                <div className="divide-y divide-[#F0EBFF]">
                    {rows.map(row => (
                        <div key={row.label} className="flex px-4 py-3 gap-4">
                            <span className="text-[12px] font-bold text-[#7D8DA6] w-36 shrink-0">{row.label}</span>
                            <span className="text-[12px] font-semibold text-[#27225B] flex-1">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ onDone }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-[#E0F5F0] flex items-center justify-center mb-5">
                <Check size={36} className="text-[#4ABCA8]" strokeWidth={3} />
            </div>
            <h2 className="text-[20px] font-black text-[#27225B] mb-2">Branch Added Successfully!</h2>
            <p className="text-[13px] font-medium text-[#7D8DA6] mb-8">The new branch has been added successfully.</p>
            <button onClick={onDone}
                className="px-8 py-3 rounded-xl text-white text-[14px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #6B4DF1 0%, #9B7CF4 100%)' }}>
                Done
            </button>
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AddBranchWizardModal({ onClose, onSuccess, initialData = null }) {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [form, setForm] = useState({
        campusName: initialData?.campusName || '',
        branchCode: initialData?.branchCode || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
        zipCode: initialData?.address?.zipCode || '',
        contactPerson: initialData?.contactPerson || '',
        contactEmail: initialData?.contactEmail || '',
        contactPhone: initialData?.contactPhone || '',
        alternatePhone: initialData?.alternatePhone || '',
        website: initialData?.website || '',
        notes: initialData?.notes || '',
    });

    const [selectedCategories, setSelectedCategories] = useState(initialData?.categories || []);
    const [customCategories, setCustomCategories] = useState([]);

    const handleFormChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const toggleCategory = (cat) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const validateStep = () => {
        if (step === 1) {
            if (!form.campusName.trim()) { alert('Branch name is required'); return false; }
        }
        if (step === 2) {
            if (!form.contactPhone.trim()) { alert('Contact phone is required'); return false; }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        setStep(s => Math.min(4, s + 1));
    };

    const handleBack = () => setStep(s => Math.max(1, s - 1));

    const handleSave = async () => {
        setSaving(true);
        try {
            const { default: api } = await import('@/lib/axios');
            const { toast } = await import('react-hot-toast');

            const payload = {
                campusName: form.campusName,
                branchCode: form.branchCode,
                address: {
                    street: form.branchCode,
                    city: form.city,
                    state: form.state,
                    zipCode: form.zipCode,
                },
                contactPerson: form.contactPerson,
                contactEmail: form.contactEmail,
                contactPhone: form.contactPhone,
                alternatePhone: form.alternatePhone,
                website: form.website,
                notes: form.notes,
                categories: selectedCategories,
                status: 'active',
            };

            if (initialData) {
                await api.put(`/facilities/${initialData._id}`, payload);
                toast.success('Branch updated successfully!');
                onSuccess?.();
                onClose();
            } else {
                await api.post('/facilities', payload);
                setSaved(true);
            }
        } catch (err) {
            const { toast } = await import('react-hot-toast');
            toast.error(err.response?.data?.message || 'Failed to save branch');
        } finally {
            setSaving(false);
        }
    };

    const handleDone = () => {
        onSuccess?.();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(30, 16, 60, 0.45)', backdropFilter: 'blur(6px)' }}>
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-[#D5C2F6]">

                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-6 pb-3 border-b border-[#F0EBFF]">
                    <h2 className="text-[18px] font-black text-[#27225B] m-0">
                        {initialData ? 'Edit Branch' : 'Add Branch'}
                    </h2>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3EEFF] border-none cursor-pointer hover:bg-[#E4DAFC] transition-colors">
                        <X size={16} className="text-[#27225B]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-7 py-5">
                    {saved ? (
                        <SuccessScreen onDone={handleDone} />
                    ) : (
                        <>
                            <StepIndicator current={step} />
                            {step === 1 && <Step1 form={form} onChange={handleFormChange} />}
                            {step === 2 && <Step2 form={form} onChange={handleFormChange} />}
                            {step === 3 && (
                                <Step3
                                    selected={selectedCategories}
                                    onToggle={toggleCategory}
                                    customCategories={customCategories}
                                    setCustomCategories={setCustomCategories}
                                />
                            )}
                            {step === 4 && <Step4 form={form} selected={selectedCategories} />}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!saved && (
                    <div className="px-7 py-5 border-t border-[#F0EBFF] flex items-center justify-between">
                        <button onClick={step === 1 ? onClose : handleBack}
                            className="px-6 py-2.5 rounded-xl border border-[#E4DAFC] text-[#7A6C9B] text-[13px] font-bold bg-white cursor-pointer hover:bg-[#F3EEFF] transition-colors">
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>
                        {step < 4 ? (
                            <button onClick={handleNext}
                                className="px-7 py-2.5 rounded-xl text-white text-[13px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ background: 'linear-gradient(135deg, #6B4DF1 0%, #9B7CF4 100%)' }}>
                                Next
                            </button>
                        ) : (
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-white text-[13px] font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-60 transition-opacity"
                                style={{ background: 'linear-gradient(135deg, #6B4DF1 0%, #9B7CF4 100%)' }}>
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                Save Branch
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
