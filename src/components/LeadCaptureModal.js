'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function LeadCaptureModal({ triggerText = "Request Information", courseId = null, source = "website_general" }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            return toast.error("Name and Email are required");
        }

        setLoading(true);
        try {
            const res = await api.post('/crm/leads', {
                ...formData,
                courseOfInterest: courseId,
                source
            });

            if (res.data.success) {
                toast.success(res.data.message || "Request submitted successfully!");
                setOpen(false);
                setFormData({ name: '', email: '', phone: '', message: '' }); // Reset
            }
        } catch (error) {
            console.error('Lead capture error:', error);
            toast.error(error.response?.data?.message || "Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#6B4DF1] hover:bg-[#5839D6] text-white shadow-[0_4px_14px_rgba(107,77,241,0.3)] transition-all h-[42px] px-6 rounded-xl font-bold text-[13px] border-none">
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-[#E9DFFC] shadow-[0_20px_60px_-15px_rgba(107,77,241,0.2)] rounded-[32px] p-0 overflow-hidden bg-white font-sans">
                
                {/* Premium Header */}
                <div className="bg-[#27225B] p-8 text-white relative overflow-hidden">
                    {/* Decorative glowing blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B4DF1] rounded-full mix-blend-screen filter blur-[60px] opacity-40 animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#FC8730] rounded-full mix-blend-screen filter blur-[60px] opacity-20"></div>

                    <DialogHeader className="relative z-10 text-left space-y-1.5">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/20">
                            <Sparkles className="text-[#E9DFFC] w-5 h-5" />
                        </div>
                        <DialogTitle className="text-[22px] font-black text-white m-0 tracking-tight">
                            Capture New Lead
                        </DialogTitle>
                        <DialogDescription className="text-[#A0ABC0] text-[13px] font-medium m-0 leading-relaxed">
                            Enter the prospect's details below to add them to your CRM pipeline.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Form Body */}
                <div className="p-8 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide">Full Name <span className="text-[#E53E3E]">*</span></Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] h-12 focus-visible:ring-2 focus-visible:ring-[#6B4DF1] focus-visible:border-transparent transition-all placeholder:text-[#A0ABC0]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide">Email <span className="text-[#E53E3E]">*</span></Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] h-12 focus-visible:ring-2 focus-visible:ring-[#6B4DF1] focus-visible:border-transparent transition-all placeholder:text-[#A0ABC0]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] h-12 focus-visible:ring-2 focus-visible:ring-[#6B4DF1] focus-visible:border-transparent transition-all placeholder:text-[#A0ABC0]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="message" className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide">Inquiry Notes (Optional)</Label>
                            <Textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="What is the prospect interested in?"
                                className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] min-h-[100px] resize-none focus-visible:ring-2 focus-visible:ring-[#6B4DF1] focus-visible:border-transparent transition-all placeholder:text-[#A0ABC0]"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#6B4DF1] hover:bg-[#5839D6] text-white rounded-xl shadow-[0_4px_14px_rgba(107,77,241,0.2)] font-bold text-[14px] mt-2 flex items-center justify-center gap-2 group transition-all border-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Add to Pipeline
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}