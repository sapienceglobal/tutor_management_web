'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
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
                <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all h-12 px-8 rounded-full font-bold">
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                    <DialogHeader className="relative z-10 text-left">
                        <DialogTitle className="text-2xl font-black mb-2 flex items-center gap-2">
                            Have questions?
                        </DialogTitle>
                        <DialogDescription className="text-slate-300">
                            Leave your details below and one of our academic counselors will reach out to you shortly.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 font-semibold">Full Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                className="bg-slate-50 border-slate-200 focus:border-indigo-500 rounded-xl h-12"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-semibold">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className="bg-slate-50 border-slate-200 focus:border-indigo-500 rounded-xl h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-700 font-semibold">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="bg-slate-50 border-slate-200 focus:border-indigo-500 rounded-xl h-12"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-slate-700 font-semibold">Message / Questions (Optional)</Label>
                            <Textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="What would you like to know?"
                                className="bg-slate-50 border-slate-200 focus:border-indigo-500 rounded-xl resize-none min-h-[100px]"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold text-lg mt-6 flex items-center gap-2 group transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Submit Request
                                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
