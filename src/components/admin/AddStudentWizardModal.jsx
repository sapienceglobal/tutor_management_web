import { useState, useRef, useEffect } from 'react';
import { X, Check, Image as ImageIcon, Plus, Trash2, Loader2, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const STEPS = [
    { title: 'Basic Details', number: 1 },
    { title: 'Contact Information', number: 2 },
    { title: 'Assigned Branch', number: 3 },
    { title: 'Parent Details', number: 4 },
    { title: 'Review & Save', number: 5 }
];

export default function AddStudentWizardModal({ isOpen, onClose, onSubmit, user }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    
    // Initial Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        gender: '',
        dob: '',
        profileImage: '',
        address: '',
        city: '',
        pinCode: '',
        state: '',
        alternatePhone: '',
        studentSmartphoneNo: '',
        assignedBranch: '',
        parentDetails: [{ firstName: '', lastName: '', email: '', phone: '' }]
    });

    useEffect(() => {
        if (isOpen) {
            // Load Mock Branches/Facilities if real ones fail
            const fetchFacilities = async () => {
                try {
                    const res = await api.get('/admin/facilities');
                    if (res.data.success) {
                        setBranches(res.data.facilities);
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
                    gender: user.gender || '',
                    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                    profileImage: user.profileImage || '',
                    address: user.address?.street || '',
                    city: user.address?.city || '',
                    pinCode: user.address?.zipCode || '',
                    state: user.address?.state || '',
                    alternatePhone: user.alternatePhone || '',
                    studentSmartphoneNo: user.studentSmartphoneNo || '',
                    assignedBranch: user.assignedBranch || '',
                    parentDetails: user.parentDetails?.length ? user.parentDetails : [{ firstName: '', lastName: '', email: '', phone: '' }]
                });
            } else {
                // Reset
                setFormData({
                    firstName: '', lastName: '', email: '', gender: '', dob: '', profileImage: '',
                    address: '', city: '', pinCode: '', state: '', alternatePhone: '', studentSmartphoneNo: '',
                    assignedBranch: '', parentDetails: [{ firstName: '', lastName: '', email: '', phone: '' }]
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
            if (!formData.dob) return toast.error('Date of Birth is required');
        } 
        // Step 2 Validation
        else if (currentStep === 2) {
            if (!formData.address.trim()) return toast.error('Address is required');
            if (!formData.city.trim()) return toast.error('City is required');
            if (!formData.pinCode.trim()) return toast.error('Pin Code is required');
            if (!formData.state.trim()) return toast.error('State is required');
        }
        // Step 4 Validation 
        else if (currentStep === 4) {
            for (let i = 0; i < formData.parentDetails.length; i++) {
                const p = formData.parentDetails[i];
                // If any field is partially filled, ensure the required ones are complete
                if (p.firstName || p.lastName || p.email || p.phone) {
                    if (!p.email.trim() || !/^\S+@\S+\.\S+$/.test(p.email)) return toast.error(`Valid Email is required for Parent ${i + 1}`);
                    if (!p.phone.trim()) return toast.error(`Mobile number is required for Parent ${i + 1}`);
                }
            }
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
            password: 'Password@123', // Default or user prompt later
            role: 'student',
            dob: formData.dob || null,
            gender: formData.gender,
            alternatePhone: formData.alternatePhone,
            studentSmartphoneNo: formData.studentSmartphoneNo,
            assignedBranch: formData.assignedBranch || null,
            parentDetails: formData.parentDetails.filter(p => p.firstName || p.lastName), // remove empties
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

    const updateParent = (index, field, value) => {
        const newParents = [...formData.parentDetails];
        newParents[index][field] = value;
        setFormData({ ...formData, parentDetails: newParents });
    };

    const addParent = () => {
        setFormData({
            ...formData,
            parentDetails: [...formData.parentDetails, { firstName: '', lastName: '', email: '', phone: '' }]
        });
    };

    const removeParent = (index) => {
        const newParents = formData.parentDetails.filter((_, i) => i !== index);
        setFormData({ ...formData, parentDetails: newParents });
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
                <div className="flex items-center justify-between px-8 py-5 border-b border-[#E9DFFC] bg-white/50 relative">
                    <h2 className="text-[20px] font-black text-[#27225B] m-0">
                        {user ? 'Edit Student' : 'Add Student'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-[#A0ABC0] hover:text-[#6B4DF1] hover:bg-[#F4F0FD] rounded-full transition-colors cursor-pointer border-none bg-transparent">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* STEPPER */}
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

                {/* BODY */}
                <div className="px-8 py-6 overflow-y-auto flex-1">
                    
                    {/* STEP 1: Basic Details */}
                    {currentStep === 1 && (
                        <div className="space-y-5 fade-in">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-4">Basic Details</h3>
                            <div className="grid grid-cols-2 gap-5">
                                <div><CustomLabel required>First Name</CustomLabel><input type="text" className={inputClass} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Rahul"/></div>
                                <div><CustomLabel required>Last Name</CustomLabel><input type="text" className={inputClass} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Gupta"/></div>
                            </div>
                            <div><CustomLabel required>Email Address</CustomLabel><input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="rahul.gupta@example.com"/></div>
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
                                <CustomLabel>Student Photo</CustomLabel>
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
                                <div><CustomLabel>Student Smartphone No <span className="font-normal text-[#A0ABC0] italic">(optional)</span></CustomLabel><input type="tel" className={inputClass} value={formData.studentSmartphoneNo} onChange={e => setFormData({...formData, studentSmartphoneNo: e.target.value})}/></div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Assigned Branch */}
                    {currentStep === 3 && (
                        <div className="space-y-5 fade-in">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-4">Assigned Branch</h3>
                            <p className="text-[13px] font-medium text-[#7D8DA6] mb-5">Select the branch to assign this student. You can assign between a Main Branch or any other branch listed below.</p>
                            
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

                    {/* STEP 4: Parent Details */}
                    {currentStep === 4 && (
                        <div className="space-y-5 fade-in">
                            <h3 className="text-[18px] font-black text-[#27225B] m-0 mb-4">Parent Details</h3>
                            
                            {formData.parentDetails.map((parent, index) => (
                                <div key={index} className="p-5 rounded-2xl border border-[#E9DFFC] bg-white relative">
                                    {index > 0 && (
                                        <button onClick={() => removeParent(index)} className="absolute top-4 right-4 text-[#FF6B6B] hover:text-[#E53E3E] bg-white border-none cursor-pointer p-1 rounded-md hover:bg-[#FFF5F5]">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                        <div><CustomLabel>Parent First Name</CustomLabel><input type="text" className={inputClass} value={parent.firstName} onChange={e => updateParent(index, 'firstName', e.target.value)} placeholder="Amit"/></div>
                                        <div><CustomLabel>Parent Last Name</CustomLabel><input type="text" className={inputClass} value={parent.lastName} onChange={e => updateParent(index, 'lastName', e.target.value)} placeholder="Gupta"/></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div><CustomLabel required>Parent Email</CustomLabel><input type="email" className={inputClass} value={parent.email} onChange={e => updateParent(index, 'email', e.target.value)} placeholder="amit.gupta@example.com"/></div>
                                        <div><CustomLabel required>Parent Mobile Number</CustomLabel><input type="tel" className={inputClass} value={parent.phone} onChange={e => updateParent(index, 'phone', e.target.value)} placeholder="+91 9912345678"/></div>
                                    </div>
                                </div>
                            ))}

                            <button onClick={addParent} className="flex items-center gap-2 text-[#6B4DF1] font-bold text-[13px] bg-transparent border-none cursor-pointer hover:text-[#5839D6] px-2 py-2">
                                <Plus size={16} strokeWidth={3} /> Add/Edit Another Parent
                            </button>
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
                                        <div><p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Gender</p><p className="text-[14px] font-bold text-[#27225B] m-0">{formData.gender || '—'}</p></div>
                                    </div>
                                </div>
                                <hr className="border-t border-[#F4F0FD] mb-6"/>
                                <h4 className="text-[14px] font-black text-[#27225B] m-0 mb-4">Contact Information</h4>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">Address: </span>{formData.address || '—'}</p></div>
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">State: </span>{formData.state || '—'}</p></div>
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">City: </span>{formData.city || '—'}</p></div>
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">Pin Code: </span>{formData.pinCode || '—'}</p></div>
                                    <div><p className="text-[13px] font-bold text-[#27225B] m-0"><span className="text-[#A0ABC0] font-semibold">Alternate Phone: </span>{formData.alternatePhone || '—'}</p></div>
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
                                        <h4 className="text-[14px] font-black text-[#27225B] m-0 mb-2">Parents</h4>
                                        <p className="text-[13px] font-bold text-[#A0ABC0] m-0">{formData.parentDetails.filter(p => p.firstName).length} Parents added</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: Success Screen */}
                    {currentStep === 6 && (
                        <div className="flex flex-col items-center justify-center text-center py-10 fade-in relative overflow-hidden">
                            <div className="w-24 h-24 bg-[#4ABCA8] rounded-full text-white flex items-center justify-center shadow-lg mx-auto mb-6">
                                <Check size={50} strokeWidth={4} />
                            </div>
                            <h2 className="text-[28px] font-medium text-[#6B4DF1] m-0 mb-4">
                                {user ? 'Student Updated Successfully!' : 'Student Added Successfully!'}
                            </h2>
                            <p className="text-[17px] font-medium text-[#27225B] max-w-lg m-0 mx-auto opacity-80 leading-relaxed z-10">
                                {`${formData.firstName} ${formData.lastName}`} has been successfully {user ? 'updated in' : 'added to'} your LMS as a student.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-10 px-8 py-3 bg-[#8957ff] hover:bg-[#7b46ef] text-white rounded-[12px] transition-colors font-semibold text-[16px] shadow-sm border-none cursor-pointer z-10"
                            >
                                Go to Student List
                            </button>
                            
                            {/* Confetti / Shapes mock decoration */}
                            <div className="absolute top-10 left-10 w-4 h-4 bg-[#4ABCA8] rotate-12 opacity-70"></div>
                            <div className="absolute bottom-10 right-20 w-4 h-4 bg-[#4ABCA8] -rotate-[15deg] opacity-70"></div>
                            <div className="absolute bottom-5 left-1/4 w-3 h-3 rounded-full bg-[#6B4DF1] opacity-70"></div>
                            <div className="absolute top-1/4 right-10 w-3 h-3 rounded-full bg-[#FC8730] opacity-50"></div>
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
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Add Student'}
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
