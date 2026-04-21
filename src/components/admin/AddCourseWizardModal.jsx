import { useState, useRef, useEffect } from 'react';
import { X, Check, BookOpen, Plus, Trash2, Loader2, ChevronRight, CheckCircle2, Rocket, Upload, ImageIcon } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const STEPS = [
    { title: 'Basic Details', number: 1 },
    { title: 'Curriculum', number: 2 },
    { title: 'Course Settings', number: 3 },
    { title: 'Review & Save', number: 4 }
];

export default function AddCourseWizardModal({ isOpen, onClose, onSubmit, course, tutorsList = [] }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    
    // Initial Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        thumbnail: '',
        modules: [],
        tutorId: '',
        price: '',
        level: 'beginner',
        duration: '',
        language: 'English',
        status: 'published'
    });

    const [moduleInput, setModuleInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchCategories = async () => {
                try {
                    const res = await api.get('/categories');
                    if (res.data?.success) setCategories(res.data.categories || res.data.data || []);
                } catch {
                    setCategories([
                        { _id: 'cat1', name: 'Computer Science' },
                        { _id: 'cat2', name: 'Management' },
                        { _id: 'cat3', name: 'Arts & Design' }
                    ]);
                }
            };
            fetchCategories();

            if (course) {
                setFormData({
                    title: course.title || '',
                    description: course.description || '',
                    categoryId: course.categoryId?._id || course.categoryId || '',
                    thumbnail: course.thumbnail || '',
                    modules: course.modules || [],
                    tutorId: course.tutorId?._id || course.tutorId || '',
                    price: course.price || '',
                    level: course.level || 'beginner',
                    duration: course.duration || '',
                    language: course.language || 'English',
                    status: course.status || 'published'
                });
            } else {
                setFormData({
                    title: '', description: '', categoryId: '', thumbnail: '', modules: [],
                    tutorId: '', price: '', level: 'beginner', duration: '', language: 'English',
                    status: 'published'
                });
            }
            setCurrentStep(1);
        }
    }, [isOpen, course]);

    const fileInputRef = useRef(null);
    
    if (!isOpen) return null;

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, thumbnail: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNext = () => {
        // Simple valid checks
        if (currentStep === 1) {
            if (!formData.title || !formData.categoryId) {
                toast.error("Please fill required fields (Title, Category)");
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };
    
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSubmit(formData);
            toast.success(course ? "Course updated successfully!" : "Course Created!");
            onClose();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to save course");
        } finally {
            setLoading(false);
        }
    };

    // Styling constants directly matching AddStudentWizardModal
    const themeColor = '#6B4DF1';
    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.2)';
    const inputClasses = "w-full px-4 py-3 rounded-xl border-none bg-[#F4F0FD] text-[#27225B] font-semibold text-[14px] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0] transition-all";
    const labelClasses = "block text-[12px] font-bold text-[#A0ABC0] mb-1.5 uppercase tracking-wide";

    const addModule = () => {
        if (!moduleInput.trim()) return;
        setFormData({ ...formData, modules: [...formData.modules, { title: moduleInput.trim() }]});
        setModuleInput('');
    };

    const removeModule = (idx) => {
        const newMods = [...formData.modules];
        newMods.splice(idx, 1);
        setFormData({ ...formData, modules: newMods });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#27225B]/40 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-[24px] flex flex-col max-h-[90vh] overflow-hidden" style={{ boxShadow: softShadow }}>
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#F4F0FD] flex items-center justify-between shrink-0 bg-[#F8F7FF]">
                    <div>
                        <h2 className="text-[20px] font-black text-[#27225B] m-0">{course ? 'Edit Course' : 'Add Course'}</h2>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Configure and manage course listings.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#7D8DA6] hover:text-[#6B4DF1] hover:bg-[#F4F0FD] transition-colors border-none cursor-pointer" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 bg-white border-b border-[#F4F0FD] shrink-0">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#F4F0FD] -z-10 -translate-y-1/2"></div>
                        <div className="absolute left-0 top-1/2 h-[2px] bg-[#6B4DF1] -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>
                        
                        {STEPS.map((step) => {
                            const isCompleted = currentStep > step.number;
                            const isCurrent = currentStep === step.number;
                            return (
                                <div key={step.number} className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 shadow-sm
                                        ${isCompleted ? 'bg-[#6B4DF1] text-white' : isCurrent ? 'bg-[#6B4DF1] text-white ring-4 ring-[#E9DFFC]' : 'bg-[#F4F0FD] text-[#A0ABC0]'}`}
                                    >
                                        {isCompleted ? <Check size={16} strokeWidth={3}/> : step.number}
                                    </div>
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isCurrent || isCompleted ? 'text-[#27225B]' : 'text-[#A0ABC0]'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content - Scrollable */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white custom-scrollbar">
                    
                    {/* STEP 1: Basic Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className={labelClasses}>Title *</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClasses} placeholder="Python Programming" />
                                </div>
                                
                                <div>
                                    <label className={labelClasses}>Description</label>
                                    <div className="bg-[#F4F0FD] rounded-xl overflow-hidden border focus-within:border-[#6B4DF1] focus-within:ring-2 focus-within:ring-[#6B4DF1] transition-all border-transparent">
                                        {/* Mock toolbar */}
                                        <div className="flex gap-2 p-2 px-4 border-b border-[#E9DFFC] bg-white/50 text-[#7D8DA6]">
                                            <span className="font-bold cursor-pointer hover:text-[#6B4DF1]">B</span>
                                            <span className="italic cursor-pointer hover:text-[#6B4DF1]">I</span>
                                            <span className="underline cursor-pointer hover:text-[#6B4DF1]">U</span>
                                        </div>
                                        <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-transparent border-none text-[#27225B] font-semibold text-[14px] focus:outline-none resize-none placeholder-[#A0ABC0]" placeholder="Learn the fundamentals..." />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClasses}>Category *</label>
                                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className={`${inputClasses} appearance-none cursor-pointer`}>
                                        <option value="" disabled>Select global category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClasses}>Course Thumbnail</label>
                                    <div className="flex gap-4">
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-32 h-20 rounded-xl bg-[#F4F0FD] border-2 border-dashed border-[#C4B5FD] flex flex-col items-center justify-center cursor-pointer hover:bg-[#E9DFFC] transition-colors shrink-0 overflow-hidden relative group"
                                        >
                                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                                            {formData.thumbnail ? (
                                                <>
                                                    <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 items-center justify-center hidden group-hover:flex">
                                                        <ImageIcon clas sName="text-white w-6 h-6" />
                                                    </div>
                                                    
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-[#A0ABC0] mb-1 group-hover:text-[#6B4DF1] transition-colors" />
                                                    <span className="text-[10px] font-bold text-[#A0ABC0]">Upload PNG/JPG</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center gap-1">
                                            <p className="text-[13px] font-bold text-[#27225B] m-0">Attach an engaging hero image.</p>  
                                            <p className="text-[12px] font-semibold text-[#A0ABC0] m-0 text-balance">The recommended size is 1200x675 pixels.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Curriculum (Simplified Outline) */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-[#F8F7FF] rounded-2xl p-5 border border-[#E9DFFC]">
                                <h3 className="text-[15px] font-black text-[#27225B] mb-1">Module Builder</h3>
                                <p className="text-[12px] font-medium text-[#7D8DA6] mb-4">Structure your course's core modules.</p>
                                
                                <div className="flex gap-2 mb-6">
                                    <input type="text" value={moduleInput} onChange={e => setModuleInput(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter') addModule(); }} placeholder="Ex: Introduction to Algebra" className={inputClasses}/>
                                    <button onClick={addModule} className="shrink-0 px-4 py-3 bg-[#E9DFFC] text-[#6B4DF1] rounded-xl font-bold text-[13px] hover:bg-[#D1C4F9] transition-colors border-none cursor-pointer">Add Module</button>
                                </div>

                                <div className="space-y-3">
                                    {formData.modules.length === 0 ? (
                                        <div className="text-center py-6 border-2 border-dashed border-[#E9DFFC] rounded-xl">
                                            <p className="text-[#A0ABC0] text-[13px] font-bold">No modules added yet.</p>
                                        </div>
                                    ) : (
                                        formData.modules.map((mod, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white p-3 px-4 rounded-xl shadow-sm border border-[#F4F0FD] group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded bg-[#F4F0FD] flex items-center justify-center text-[#6B4DF1] font-black text-[11px]">{idx + 1}</div>
                                                    <span className="font-bold text-[#27225B] text-[14px]">{mod.title}</span>
                                                </div>
                                                <button onClick={() => removeModule(idx)} className="text-[#A0ABC0] hover:text-red-500 bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Course Settings */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Course Price (₹)</label>
                                    <input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputClasses} placeholder="0 (Free)" />
                                </div>
                                <div>
                                    <label className={labelClasses}>Difficulty Level</label>
                                    <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className={`${inputClasses} appearance-none cursor-pointer`}>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Language</label>
                                    <input type="text" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className={inputClasses} placeholder="English, Hindi, etc." />
                                </div>
                                <div>
                                    <label className={labelClasses}>Duration (Mins)</label>
                                    <input type="number" min="0" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={inputClasses} placeholder="120" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>Assign to Tutor (Course Owner)</label>
                                <select value={formData.tutorId} onChange={e => setFormData({...formData, tutorId: e.target.value})} className={`${inputClasses} appearance-none cursor-pointer`}>
                                    <option value="">-- Institute Default / Global --</option>
                                    {tutorsList.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                                </select>
                                <p className="text-[11px] text-[#A0ABC0] mt-2 font-medium">Leave empty to label it as an official institute-led master course.</p>
                            </div>

                            <div>
                                <label className={labelClasses}>Publish Status</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`${inputClasses} appearance-none cursor-pointer`}>
                                    <option value="published">Active & Published</option>
                                    <option value="draft">Draft (Hidden)</option>
                                </select>
                            </div>

                        </div>
                    )}

                    {/* STEP 4: Review & Save */}
                    {currentStep === 4 && (
                        <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col items-center justify-center text-center py-6">
                            
                            <div className="w-24 h-24 rounded-full bg-[#ECFDF5] border-[6px] border-[#D1FAE5] flex items-center justify-center mb-6">
                                <Rocket className="w-10 h-10 text-[#4ABCA8]" />
                            </div>
                            
                            <h2 className="text-[24px] font-black text-[#27225B] mb-2">Ready to Launch!</h2>
                            <p className="text-[14px] font-semibold text-[#7D8DA6] max-w-sm mb-8">
                                Please review your configuration. Clicking Finish will explicitly provision the course endpoints across the student network.
                            </p>

                            <div className="w-full max-w-md bg-[#F8F7FF] rounded-2xl p-5 border border-[#E9DFFC] text-left">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-[#E9DFFC]">
                                        <span className="text-[13px] font-bold text-[#A0ABC0] uppercase">Title</span>
                                        <span className="text-[14px] font-black text-[#27225B]">{formData.title || 'Untitled'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-[#E9DFFC]">
                                        <span className="text-[13px] font-bold text-[#A0ABC0] uppercase">Modules</span>
                                        <span className="text-[14px] font-black text-[#27225B]">{formData.modules.length} Included</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[13px] font-bold text-[#A0ABC0] uppercase">Price</span>
                                        <span className="text-[14px] font-black text-[#4ABCA8]">₹{formData.price || '0.00'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-5 bg-[#F8F7FF] border-t border-[#F4F0FD] shrink-0 flex items-center justify-between">
                    <button 
                        onClick={currentStep === 1 ? onClose : handleBack}
                        className="px-6 py-3 rounded-xl font-bold text-[14px] border-none cursor-pointer transition-colors text-[#7D8DA6] bg-transparent hover:bg-[#E9DFFC]"
                    >
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>
                    
                    {currentStep < STEPS.length ? (
                        <button 
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-[14px] border-none cursor-pointer transition-all text-white bg-[#6B4DF1] hover:bg-[#5839D6] shadow-[0_4px_14px_rgba(107,77,241,0.3)] hover:shadow-[0_6px_20px_rgba(107,77,241,0.4)]"
                        >
                            Next Step <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-[14px] border-none cursor-pointer transition-all text-white bg-[#4ABCA8] hover:bg-[#389E8D] shadow-[0_4px_14px_rgba(74,188,168,0.3)] disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16}/> Finish & Save</>}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
