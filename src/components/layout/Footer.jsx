'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Brain } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-[#0F172A] text-slate-300 font-sans border-t border-indigo-900/50">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <div className="relative">
                                <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                                <Brain className="w-8 h-8 text-orange-500 relative z-10" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                YaadKaro
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed max-w-sm">
                            The ultimate platform for learning and teaching. Connect with expert tutors, access premium courses, and achieve your educational goals with ease.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {['About Us', 'Contact Us', 'Become a Tutor', 'Plans & Pricing', 'Terms & Conditions', 'Privacy Policy'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                            Top Categories
                        </h3>
                        <ul className="space-y-3">
                            {['Development', 'Business', 'Design', 'Marketing', 'Data Science', 'Personal Development'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                            Contact Us
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 group">
                                <div className="p-3 rounded-lg bg-slate-800 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold mb-1">Our Location</p>
                                    <p className="text-sm text-slate-400">123 Education Street, Learning Hub, NY 10001, USA</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 group">
                                <div className="p-3 rounded-lg bg-slate-800 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold mb-1">Email Address</p>
                                    <p className="text-sm text-slate-400">support@yaadkaro.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 group">
                                <div className="p-3 rounded-lg bg-slate-800 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold mb-1">Phone Number</p>
                                    <p className="text-sm text-slate-400">+1 (555) 123-4567</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800 bg-[#0B1120]">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <p>© 2026 <span className="text-white font-semibold">YaadKaro</span>. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
