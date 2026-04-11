import { useState, useRef, useEffect } from 'react';
import { X, Check, Image as ImageIcon, Plus, Loader2, ChevronRight, Search } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const STEPS = [
    { title: 'Basic Details', number: 1 },
    { title: 'Contact Information', number: 2 },
    { title: 'Assigned Branch', number: 3 },
    { title: 'Assigned Subjects', number: 4 },
    { title: 'Review & Save', number: 5 }
];

const SUBJECT_CATEGORIES = [
    { name: 'Engineering', subjects: ['Computer Science', 'Data Science', 'Python Programming', 'Mechanical Engineering'] },
    { name: 'Management', subjects: ['Business Management', 'Marketing', 'Finance'] },
    { name: 'Arts & Science', subjects: ['English Literature', 'History', 'Psychology'] }
];

export default function AddInstructorWizardModal({ isOpen, onClose, onSubmit, user }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [subjectSearch, setSubjectSearch] = useState('');
    
    // Initial Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        dob: '',
        profileImage: '',
        address: '',
        city: '',
        pinCode: '',
        state: '',
        alternatePhone: '',
        website: '',
        assignedBranch: '',
        subjects: []
    });

    useEffect(() => {
        if (isOpen) {
            // Load Mock Branches/Facilities if real ones fail
            const fetchFacilities = async () => {
                try {
                    const res = await api.get('/facilities');
                    if (res.data.success) {
                        setBranches(res.data.data || res.data.facilities);
                    }
                } catch {
                    // Fallback to mocks if no facility route exists yet, but visually requested
                    setBranches([
                        { _id: 'mock1', campusName: 'Chennai Main Branch', address: { street: '123 Anna Salai', city: 'Chennai', state: 'TN' }, tags: 'Engineering' },
                        { _id: 'mock2', campusName: 'Mumbai Branch', address: { street: '400, Andheri East', city: 'Mumbai', state: 'MH' }, tags: 'Management' }
                    ]);
                }
            };
            fetchFacilities();

            // Setup edit state if user is passed
            if (user) {
                const names = (user.name || '').split(' ');
                setFormData({
                    ...formData,
                    firstName: names[0] || '',
                    lastName: names.slice(1).join(' ') || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    gender: user.gender || '',
                    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                    profileImage: user.profileImage || '',
                    address: user.address?.street || '',
                    city: user.address?.city || '',
                    pinCode: user.address?.zipCode || '',
                    state: user.address?.state || '',
                    alternatePhone: user.alternatePhone || '',
                    website: user.website || '',
                    assignedBranch: user.assignedBranch || '',
                    subjects: user.subjects || []
                });
            } else {
                // Reset
                setFormData({
                    firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '', profileImage: '',
                    address: '', city: '', pinCode: '', state: '', alternatePhone: '', website: '',
                    assignedBranch: '', subjects: []
                });
            }
            setCurrentStep(1);
        }
    }, [isOpen, user]);

    const fileInputRef = useRef(null);
    
    if (!isOpen) return null;

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profileImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNext = () => {
        // Step 1 Validation
        if (currentStep === 1) {
            if (!formData.firstName.trim()) return toast.error('First Name is required');
            if (!formData.lastName.trim()) return toast.error('Last Name is required');
            if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) return toast.error('Valid Email Address is required');
            if (!formData.phone.trim()) return toast.error('Mobile Number is required');
            if (!formData.dob) return toast.error('Date of Birth is required');
        } 
        // Step 2 Validation
        else if (currentStep === 2) {
            if (!formData.address.trim()) return toast.error('Address is required');
            if (!formData.city.trim()) return toast.error('City is required');
            if (!formData.pinCode.trim()) return toast.error('Pin Code is required');
            if (!formData.state.trim()) return toast.error('State is required');
        }
        else if (currentStep === 4) {
            if (formData.subjects.length === 0) return toast.error('Please assign at least one subject to the instructor.');
        }
        
        if (currentStep < 5) setCurrentStep(curr => curr + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(curr => curr - 1);
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        // Map to API payload 
        const payload = {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            password: 'Password@123', // Default
            role: 'tutor',
            phone: formData.phone,
            dob: formData.dob || null,
            gender: formData.gender,
            alternatePhone: formData.alternatePhone,
            website: formData.website,
            assignedBranch: formData.assignedBranch || null,
            subjects: formData.subjects,
            address: {
                street: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.pinCode,
                country: 'India'
            },
            profileImage: formData.profileImage
        };

        if (user && !payload.password) delete payload.password; // Don't override if editing
        
        const success = await onSubmit(payload, user ? user._id : null);
        setLoading(false);
        if (success) {
            setCurrentStep(6);
        }
    };

    // --- RENDERERS ---
    
    // Custom label text
    const CustomLabel = ({ children, required }) => (
        <label className="block text-[13px] font-semibold text-[#4A3E68] mb-1.5">
            {children} {required && <span className="text-[#FC8730]">*</span>}
        </label>
    );

    // Custom input style
    const inputClass = "w-full px-4 py-2.5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] text-[14px] text-[#27225B] font-medium transition-all placeholder-[#A0ABC0]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fallback-purple-bg">
            <style jsx>{`
                .fallback-purple-bg { background-color: rgba(30, 20, 60, 0.4); }
                .modal-content {
                    background: linear-gradient(180deg, #FDFBFF 0%, #F4EEFC 100%);
                }
            `}</style>
            <div className="modal-content rounded-[28px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#E9DFFC] flex flex-col max-h-[90vh]">
                
                {/* HEAD & CLOSE */}
                {currentStep < 6 && (
                    <div className="flex items-center justify-between px-8 py-5 border-b border-[#E9DFFC] bg-white/50 relative">
                        <h2 className="text-[20px] font-black text-[#27225B] m-0">
                            {user ? 'Edit Instructor' : 'Add Instructor'}
                        </h2>
                        <button onClick={onClose} className="p-2 text-[#A0ABC0] hover:text-[#6B4DF1] hover:bg-[#F4F0FD] rounded-full transition-colors cursor-pointer border-none bg-transparent">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
                {currentStep === 6 && (
                    <div className="flex flex-row-reverse p-4 relative z-20">
                        <button onClick={onClose} className="p-2 text-[#A0ABC0] hover:text-[#6B4DF1] rounded-full transition-colors cursor-pointer border-none bg-transparent">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* STEPPER */}
                {currentStep < 6 && (
                    <div className="px-8 py-5 bg-white/30 border-b border-[#E9DFFC] overflow-x-auto">
                        <div className="flex items-center justify-between min-w-[600px]">
                            {STEPS.map((step, idx) => {
                                const isCompleted = currentStep > step.number;
                                const isActive = currentStep === step.number;
                                
                                return (
                                    <div key={step.number} className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-colors
                                            ${isCompleted ? 'bg-[#4ABCA8] text-white' : 
                                              isActive ? 'bg-[#6B4DF1] text-white ring-4 ring-[#E9DFFC]' : 
                                              'bg-[#E9DFFC] text-[#A0ABC0]'}`}>
                                            {isCompleted ? <Check size={14} strokeWidth={3}/> : step.number}
                                        </div>
                                        <span className={`text-[13px] font-bold whitespace-nowrap 
                                            ${isActive ? 'text-[#27225B]' : isCompleted ? 'text-[#4ABCA8]' : 'text-[#A0ABC0]'}`}>
                                            {step.title}
                                        </span>
                                        {idx !== STEPS.length - 1 && (
                                            <div className={`w-8 h-[2px] ml-2 ${isCompleted ? 'bg-[#4ABCA8]' : 'bg-[#E9DFFC]'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* BODY */}
                <div className="px-8 py-6 overflow-y-auto flex-1">
                    
                    {/* STEP 1: Basic Details */}
                    {currentStep === 1 && (
                        <div className="space-y-5 fade-in">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-4">Basic Details</h3>
                            <div className="grid grid-cols-2 gap-5">
                                <div><CustomLabel required>First Name</CustomLabel><input type="text" className={inputClass} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Amit"/></div>
                                <div><CustomLabel required>Last Name</CustomLabel><input type="text" className={inputClass} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Sharma"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div><CustomLabel required>Email Address</CustomLabel><input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="amit.sharma@example.com"/></div>
                                <div><CustomLabel required>Mobile Number</CustomLabel><input type="tel" className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 9876543210"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <CustomLabel>Gender</CustomLabel>
                                    <select className={inputClass} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div><CustomLabel required>Date of Birth</CustomLabel><input type="date" className={inputClass} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}/></div>
                            </div>
                            
                            <div>
                                <CustomLabel>Instructor Photo</CustomLabel>
                                <div className="flex items-center gap-4 bg-[#F9F7FC] p-4 rounded-xl border border-[#E9DFFC]">
                                    <div className="w-16 h-16 rounded-xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                        {formData.profileImage ? (
                                            <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="text-[#A0ABC0] opacity-50" size={24} />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 items-start">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-white border border-[#D1C4F9] text-[#6B4DF1] text-[13px] font-bold rounded-lg cursor-pointer hover:bg-[#F4F0FD]">Choose File</button>
                                            <span className="text-[12px] font-medium text-[#7D8DA6]">{formData.profileImage ? 'File selected' : 'No file chosen'}</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-[#A0ABC0]">JPG or PNG (Max 5MB)</span>
                                        <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Contact Information */}
                    {currentStep === 2 && (
                        <div className="space-y-5 fade-in">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-4">Contact Information</h3>
                            <div><CustomLabel required>Address</CustomLabel><input type="text" className={inputClass} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street address"/></div>
                            <div>
                                <CustomLabel required>City</CustomLabel>
                                <input type="text" className={inputClass} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Select city (e.g. Chennai)"/>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div><CustomLabel required>Pin Code</CustomLabel><input type="text" className={inputClass} value={formData.pinCode} onChange={e => setFormData({...formData, pinCode: e.target.value})} placeholder="e.g. 600001"/></div>
                                <div><CustomLabel required>State</CustomLabel><input type="text" className={inputClass} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="e.g. Tamil Nadu"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div><CustomLabel>Alternate Phone <span className="font-normal text-[#A0ABC0] italic">(optional)</span></CustomLabel><input type="tel" className={inputClass} value={formData.alternatePhone} onChange={e => setFormData({...formData, alternatePhone: e.target.value})} placeholder="+91"/></div>
                                <div><CustomLabel>Personal Website <span className="font-normal text-[#A0ABC0] italic">(optional)</span></CustomLabel><input type="text" className={inputClass} value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="www.amitsharma.com"/></div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Assigned Branch */}
                    {currentStep === 3 && (
                        <div className="space-y-5 fade-in">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-4">Assigned Branch</h3>
                            <p className="text-[13px] font-medium text-[#7D8DA6] mb-5">Select the branch to assign this instructor. You can assign between a Main Branch or any other branch listed below.</p>
                            
                            <div className="space-y-3">
                                {branches.length > 0 ? branches.map((b) => (
                                    <label key={b._id} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.assignedBranch === b._id ? 'border-[#6B4DF1] bg-[#F4F0FD]' : 'border-[#E9DFFC] bg-[#F9F7FC] hover:border-[#D1C4F9]'}`}>
                                        <input type="radio" name="branch" value={b._id} checked={formData.assignedBranch === b._id} onChange={() => setFormData({...formData, assignedBranch: b._id})} className="hidden" />
                                        
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors ${formData.assignedBranch === b._id ? 'border-[#6B4DF1]' : 'border-[#A0ABC0]'}`}>
                                            {formData.assignedBranch === b._id && <div className="w-2.5 h-2.5 rounded-full bg-[#6B4DF1]"></div>}
                                        </div>
                                        
                                        <div className="flex-1 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                                                    <span className="text-xl">🏢</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-[14px] font-bold text-[#27225B] m-0">{b.campusName || 'Branch'}</h4>
                                                    <p className="text-[12px] font-medium text-[#7D8DA6] m-0 mt-0.5">{b.address?.street}, {b.address?.city}</p>
                                                </div>
                                            </div>
                                            {b.tags && (
                                                <span className="px-3 py-1 bg-[#E9DFFC] text-[#6B4DF1] text-[11px] font-bold rounded-full">{b.tags}</span>
                                            )}
                                        </div>
                                    </label>
                                )) : (
                                    <p className="text-[13px] italic text-[#A0ABC0]">No branches configured in system.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Assigned Subjects */}
                    {currentStep === 4 && (
                        <div className="space-y-4 fade-in pb-4">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-1">Assigned Subjects</h3>
                            <p className="text-[13px] font-medium text-[#7D8DA6] mb-5">Select subjects to assign this instructor. You can assign multiple subjects as per the instructor's qualifications.</p>
                            
                            <div className="relative mb-4">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                                <input 
                                    type="text" 
                                    className={`${inputClass} pl-10 bg-white`} 
                                    placeholder="Search subjects..." 
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                />
                            </div>

                            <div className="bg-white rounded-xl border border-[#E9DFFC] overflow-hidden">
                                {SUBJECT_CATEGORIES.map((category, catIdx) => {
                                    // Filter subjects based on search
                                    const filteredSubjects = category.subjects.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()));
                                    if (filteredSubjects.length === 0 && subjectSearch !== '') return null;

                                    return (
                                        <div key={catIdx} className={catIdx !== 0 ? "border-t border-[#E9DFFC]" : ""}>
                                            <div className="bg-[#F9F7FC] px-4 py-3">
                                                <span className="text-[12px] font-bold text-[#7A6C9B] uppercase tracking-wider">{category.name}</span>
                                            </div>
                                            <div>
                                                {filteredSubjects.map((sub, subIdx) => {
                                                    const isSelected = formData.subjects.includes(sub);
                                                    return (
                                                        <label key={subIdx} className="flex items-center justify-between px-5 py-3 border-b border-[#F4F0FD] last:border-0 cursor-pointer hover:bg-[#F8F7FF] transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-[22px] h-[22px] rounded-[6px] border-[2px] flex items-center justify-center transition-colors ${isSelected ? 'bg-[#6B4DF1] border-[#6B4DF1]' : 'border-[#D1C4F9] bg-white'}`}>
                                                                    {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                                                </div>
                                                                <span className={`text-[13.5px] font-bold leading-none select-none ${isSelected ? 'text-[#6B4DF1]' : 'text-[#4A3E68]'}`}>{sub}</span>
                                                                <input type="checkbox" className="hidden" 
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setFormData({...formData, subjects: [...formData.subjects, sub]});
                                                                        else setFormData({...formData, subjects: formData.subjects.filter(s => s !== sub)});
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="px-3 py-1 bg-[#F4F0FD] text-[#6B4DF1] text-[11px] font-bold rounded-full">{category.name} ▾</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-[#F9F7FC] rounded-xl border border-[#D1C4F9] mt-6">
                                <div className="flex flex-col">
                                    <span className="text-[12px] text-[#A0ABC0] font-medium leading-loose">Assigning to: <span className="text-[14px] font-bold text-[#27225B] ml-1">{branches.find(b => b._id === formData.assignedBranch)?.campusName || 'Unassigned'}</span></span>
                                    <span className="text-[11px] font-medium text-[#7D8DA6] mt-0.5">{branches.find(b => b._id === formData.assignedBranch)?.address?.street}, {branches.find(b => b._id === formData.assignedBranch)?.address?.city}</span>
                                </div>
                                <span className="px-3 py-1.5 bg-[#E9DFFC] text-[#6B4DF1] text-[12px] font-bold rounded-xl">{branches.find(b => b._id === formData.assignedBranch)?.tags || 'Engineering'} ▾</span>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Review & Save */}
                    {currentStep === 5 && (
                        <div className="space-y-6 fade-in">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-4">Review & Save</h3>
                            
                            <div className="bg-white p-5 rounded-2xl border border-[#E9DFFC]">
                                <div className="flex gap-5 mb-6">
                                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-[#E9DFFC] shadow-sm flex items-center justify-center">
                                        {formData.profileImage ? <img src={formData.profileImage} className="w-full h-full object-cover" alt="Profile" /> : <ImageIcon className="text-[#A0ABC0]" size={28} />}
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div><p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">First Name</p><p className="text-[14px] font-bold text-[#27225B] m-0">{formData.firstName || '—'}</p></div>
                                        <div><p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Last Name</p><p className="text-[14px] font-bold text-[#27225B] m-0">{formData.lastName || '—'}</p></div>
                                        <div><p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Email Address</p><p className="text-[14px] font-bold text-[#27225B] m-0">{formData.email || '—'}</p></div>
                                        <div><p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Mobile Number</p><p className="text-[14px] font-bold text-[#27225B] m-0">{formData.phone || '—'}</p></div>
                                    </div>
                                </div>
                                <hr className="border-t border-[#F4F0FD] mb-6"/>
                                <h4 className="text-[14px] font-black text-[#27225B] m-0 mb-4">Contact Information</h4>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                    <div className="col-span-2"><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">Address: </span>{formData.address || '—'}, {formData.city}</p></div>
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">State: </span>{formData.state || '—'}</p></div>
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">Pin Code: </span>{formData.pinCode || '—'}</p></div>
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">Website: </span>{formData.website || '—'}</p></div>
                                </div>
                                <hr className="border-t border-[#F4F0FD] my-6"/>
                                <div className="flex gap-x-12">
                                    <div>
                                        <h4 className="text-[14px] font-black text-[#27225B] m-0 mb-2">Assigned Branch</h4>
                                        <p className="text-[13px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-3 py-1.5 rounded-lg inline-block m-0">
                                            {branches.find(b => b._id === formData.assignedBranch)?.campusName || 'Unassigned'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-black text-[#27225B] m-0 mb-2">Assigned Subjects</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.subjects.length > 0 ? formData.subjects.map(sub => (
                                                <span key={sub} className="text-[11px] font-bold text-[#27225B] bg-[#F4F0FD] px-2 py-1 rounded-md mb-0">
                                                    {sub}
                                                </span>
                                            )) : <span className="text-[13px] font-bold text-[#A0ABC0] m-0">No subjects assigned</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: Success Screen */}
                    {currentStep === 6 && (
                        <div className="flex flex-col items-center justify-center py-6 fade-in relative overflow-hidden -mt-8">
                            <div className="w-[72px] h-[72px] bg-[#4ABCA8] rounded-full text-white flex items-center justify-center shadow-lg mx-auto mb-5 z-10">
                                <Check size={40} strokeWidth={4} />
                            </div>
                            <h2 className="text-[24px] font-medium text-[#6B4DF1] m-0 mb-4 z-10 text-center">
                                {user ? 'Instructor Updated Successfully!' : 'Instructor Added Successfully!'}
                            </h2>
                            <p className="text-[15px] font-medium text-[#27225B] m-0 mx-auto opacity-80 z-10 text-center max-w-md">
                                <span className="font-bold">{`${formData.firstName} ${formData.lastName}`}</span> has been successfully {user ? 'updated in' : 'added as an instructor to'} your LMS.
                            </p>
                            
                            <div className="mt-8 mb-6 p-6 bg-transparent border border-[#F4F0FD] rounded-xl w-full text-left space-y-3 z-10 shadow-sm" style={{background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(5px)'}}>
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">First Name:</span><span className="text-[13px] font-bold text-[#27225B]">{formData.firstName}</span></div>
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">Last Name:</span><span className="text-[13px] font-bold text-[#27225B]">{formData.lastName}</span></div>
                                <div className="grid grid-cols-[130px_1fr] items-center">
                                    <span className="text-[13px] text-[#A0ABC0] font-medium">Email Address:</span>
                                    <div className="flex items-center gap-4 text-[13px] font-bold text-[#27225B]"><span>{formData.email}</span> <span>{formData.phone}</span></div>
                                </div>
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">Gender:</span><span className="text-[13px] font-bold text-[#27225B]">{formData.gender}</span></div>
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">Date of Birth:</span><span className="text-[13px] font-bold text-[#27225B]">{new Date(formData.dob).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span></div>
                                <br />
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">Address:</span><span className="text-[13px] font-bold text-[#27225B]">{formData.address}</span></div>
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">City:</span><span className="text-[13px] font-bold text-[#27225B]">{formData.city}</span></div>
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">State:</span><span className="text-[13px] font-bold text-[#27225B]">{formData.state}</span></div>
                                <div className="grid grid-cols-[130px_1fr]"><span className="text-[13px] text-[#A0ABC0] font-medium">Pin Code:</span><span className="text-[13px] font-bold text-[#27225B]">{formData.pinCode}</span></div>
                                <div className="mt-4 pt-4 border-t border-[#E9DFFC] flex items-center justify-between">
                                    <span className="text-[13px] text-[#A0ABC0] font-medium">Assigned Branch: <span className="font-bold text-[#6B4DF1] ml-2">{branches.find(b => b._id === formData.assignedBranch)?.campusName || 'Unassigned'}</span> 
                                        <br/><span className="text-[11px] ml-[115px] block -mt-1">{branches.find(b => b._id === formData.assignedBranch)?.address?.street}, {branches.find(b => b._id === formData.assignedBranch)?.address?.city}</span>
                                    </span>
                                    <span className="px-3 py-1 bg-[#E9DFFC] text-[#6B4DF1] text-[12px] font-bold rounded-xl">{branches.find(b => b._id === formData.assignedBranch)?.tags || 'Engineering'} ▾</span>
                                </div>
                            </div>
                            
                            <div className="w-full flex items-center justify-end gap-3 z-10 pt-2">
                                <button onClick={onClose} className="px-8 py-2.5 bg-transparent border border-[#D1C4F9] text-[#6B4DF1] rounded-xl transition-colors font-bold text-[14px] hover:bg-[#F4F0FD] cursor-pointer">
                                    Back
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-2.5 bg-[#6B4DF1] hover:bg-[#5F43DB] text-white rounded-xl transition-colors font-bold text-[14px] shadow-md border-none cursor-pointer"
                                >
                                    Save & Add Instructor
                                </button>
                            </div>

                            {/* Confetti / Shapes mock decoration matching the image closely */}
                            <div className="absolute top-10 left-10 w-4 h-[6px] rounded-full bg-[#4ABCA8] rotate-45 opacity-60"></div>
                            <div className="absolute top-20 right-20 w-3 h-3 bg-[#6B4DF1] rotate-[30deg] opacity-40"></div>
                            <div className="absolute bottom-24 right-12 w-4 h-4 bg-[#6B4DF1] rounded rotate-12 opacity-50"></div>
                            <div className="absolute top-40 left-8 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-[#E9DFFC] rotate-[-20deg]"></div>
                            <div className="absolute top-1/2 right-10 w-3 h-[8px] rounded-full bg-[#4ABCA8] -rotate-12 opacity-70"></div>
                            <div className="absolute bottom-16 left-32 w-3 h-[6px] rounded-full bg-[#4ABCA8] rotate-12 opacity-70"></div>
                        </div>
                    )}
                </div>

                {/* FOOTER BUTTONS */}
                {currentStep < 6 && (
                    <div className="px-8 py-5 border-t border-[#E9DFFC] bg-white flex items-center justify-between">
                        <button
                            onClick={currentStep === 1 ? onClose : handleBack}
                            disabled={loading}
                            className="px-6 py-2.5 text-[#A0ABC0] hover:bg-[#F4F0FD] hover:text-[#6B4DF1] rounded-xl transition-colors font-bold text-[14px] bg-transparent border border-[#F4F0FD] cursor-pointer"
                        >
                            {currentStep === 1 ? 'Cancel' : 'Back'}
                        </button>
                        
                        {currentStep < 5 ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-2.5 bg-[#6B4DF1] hover:bg-[#5F43DB] text-white rounded-xl transition-colors font-bold text-[14px] shadow-lg border-none cursor-pointer flex items-center gap-2"
                            >
                                Next <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="px-8 py-2.5 bg-[#6B4DF1] hover:bg-[#5F43DB] text-white rounded-xl transition-colors font-bold text-[14px] shadow-lg border-none cursor-pointer flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Add Instructor'}
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
