'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Brain } from 'lucide-react';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';

export function Footer() {
    const { settings } = useSettings();
    const { institute } = useInstitute();

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
                                {settings.siteName || 'Sapience'}
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed max-w-sm">
                            The ultimate platform for learning and teaching. Connect with expert tutors, access premium courses, and achieve your educational goals with ease.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            {settings.facebookLink && (
                                <a href={settings.facebookLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                    <Facebook className="w-5 h-5" />
                                </a>
                            )}
                            {settings.twitterLink && (
                                <a href={settings.twitterLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                    <Twitter className="w-5 h-5" />
                                </a>
                            )}
                            {settings.instagramLink && (
                                <a href={settings.instagramLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                            {settings.linkedinLink && (
                                <a href={settings.linkedinLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                            {settings.youtubeLink && (
                                <a href={settings.youtubeLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all duration-300 border border-slate-700 hover:border-orange-500">
                                    <Youtube className="w-5 h-5" />
                                </a>
                            )}
                            {/* If no social links set, show placeholders */}
                            {!settings.facebookLink && !settings.twitterLink && !settings.instagramLink && !settings.linkedinLink && (
                                <>
                                    <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                        <Facebook className="w-5 h-5" />
                                    </span>
                                    <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                        <Twitter className="w-5 h-5" />
                                    </span>
                                    <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                        <Instagram className="w-5 h-5" />
                                    </span>
                                    <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                        <Linkedin className="w-5 h-5" />
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'About Us', href: '/page/about-us' },
                                { label: 'Contact Us', href: '/page/contact-us' },
                                { label: 'Blog', href: '/blog' },
                                { label: 'Become a Tutor', href: '/register' },
                                { label: 'Terms & Conditions', href: '/page/terms-and-conditions' },
                                { label: 'Privacy Policy', href: '/page/privacy-policy' },
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="flex items-center gap-2 hover:text-orange-500 transition-colors group">
                                        <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                                        {item.label}
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

                    {/* Contact Info — DB-driven */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                            Contact Us
                        </h3>
                        <div className="space-y-4">
                            {settings.contactAddress && (
                                <div className="flex items-start gap-4 group">
                                    <div className="p-3 rounded-lg bg-slate-800 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold mb-1">Our Location</p>
                                        <p className="text-sm text-slate-400">{settings.contactAddress}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-4 group">
                                <div className="p-3 rounded-lg bg-slate-800 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold mb-1">Email Address</p>
                                    <p className="text-sm text-slate-400">{institute?.contactEmail || settings.contactEmail || settings.supportEmail || 'Not set'}</p>
                                </div>
                            </div>
                            {(settings.supportPhone) && (
                                <div className="flex items-start gap-4 group">
                                    <div className="p-3 rounded-lg bg-slate-800 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold mb-1">Phone Number</p>
                                        <p className="text-sm text-slate-400">{settings.supportPhone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar — DB-driven footer text */}
            <div className="border-t border-slate-800 bg-[#0B1120]">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <p>{settings.footerText || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`}</p>
                        <div className="flex items-center gap-6">
                            <Link href="/page/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="/page/terms-and-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
