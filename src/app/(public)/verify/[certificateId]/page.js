'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { 
    MdEmojiEvents, MdCheckCircle, MdSchool, 
    MdCalendarMonth, MdShield, MdArrowBack, 
    MdHourglassEmpty, MdErrorOutline, MdPerson, MdVerified
} from 'react-icons/md';

export default function VerifyCertificatePage() {
    const params = useParams();
    const router = useRouter();
    const certificateId = params.certificateId;

    const [loading, setLoading] = useState(true);
    const [cert, setCert] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (certificateId) {
            fetchCertificateDetails();
        }
    }, [certificateId]);

    const fetchCertificateDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/certificates/verify/${certificateId}`);
            if (res.data?.success && res.data?.certificate) {
                setCert(res.data.certificate);
            } else {
                setError('Certificate details not found.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Certificate not found. This credential ID is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', fontFamily: "'Nunito', sans-serif" }}>
                <div className="flex flex-col items-center gap-3 text-slate-300">
                    <MdHourglassEmpty className="animate-spin" style={{ width: 48, height: 48, color: '#6366f1' }} />
                    <p style={{ fontSize: '15px', fontWeight: '600' }}>Verifying credential authenticity...</p>
                </div>
            </div>
        );
    }

    if (error || !cert) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', fontFamily: "'Nunito', sans-serif" }}>
                <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <MdErrorOutline style={{ width: 32, height: 32, color: '#f87171' }} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error || 'This certificate is not valid or does not exist.'}</p>
                    <button onClick={() => router.push('/')}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all border-none cursor-pointer shadow-lg shadow-indigo-900/40">
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    const issuedDate = new Date(cert.issuedAt);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #090d16 0%, #111424 100%)', fontFamily: "'Nunito', sans-serif" }}>
            
            {/* Glowing background accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 w-full max-w-2xl">
                {/* Back button */}
                <button onClick={() => router.push('/')}
                    className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-sm font-semibold">
                    <MdArrowBack style={{ width: 18, height: 18 }} /> Back to Home
                </button>

                {/* Main Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600" />
                    
                    <div className="p-8 md:p-12">
                        {/* Seal Header */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" 
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <MdVerified style={{ width: 16, height: 16, color: '#10b981' }} />
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Verified Credential
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Sapience LMS Credential Registry</h1>
                            <p className="text-slate-400 text-sm mt-2">This is a certified official confirmation of course completion.</p>
                        </div>

                        {/* Certificate Box */}
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 md:p-8 mb-8 space-y-6">
                            
                            {/* Course Section */}
                            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-800/60">
                                <div className="w-16 h-16 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                    <MdEmojiEvents style={{ width: 32, height: 32, color: '#818cf8' }} />
                                </div>
                                <div className="text-center sm:text-left">
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Completed</span>
                                    <h2 className="text-xl font-bold text-white mt-1 leading-snug">{cert.courseName}</h2>
                                </div>
                            </div>

                            {/* Recipient and Issuer Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Student */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                                        {cert.studentAvatar ? (
                                            <img src={cert.studentAvatar} alt={cert.studentName} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <MdPerson style={{ width: 20, height: 20, color: '#94a3b8' }} />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Recipient</span>
                                        <p className="text-slate-200 font-bold mt-0.5">{cert.studentName}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{cert.studentEmail}</p>
                                    </div>
                                </div>

                                {/* Tutor */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                                        <MdSchool style={{ width: 20, height: 20, color: '#94a3b8' }} />
                                    </div>
                                    <div>
                                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Authorized Tutor</span>
                                        <p className="text-slate-200 font-bold mt-0.5">{cert.tutorName}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">Apex Academy Instructor</p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Metadata */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800/60">
                                <div className="flex items-center gap-3">
                                    <MdCalendarMonth style={{ width: 18, height: 18, color: '#94a3b8' }} />
                                    <div>
                                        <span className="text-slate-500 text-xs block">Date of Issue</span>
                                        <span className="text-slate-300 text-sm font-semibold">
                                            {issuedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <MdShield style={{ width: 18, height: 18, color: '#94a3b8' }} />
                                    <div>
                                        <span className="text-slate-500 text-xs block">Credential ID</span>
                                        <span className="text-slate-300 text-sm font-mono font-semibold truncate max-w-[180px] block">
                                            {cert.certificateId}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer message */}
                        <div className="text-center">
                            <p className="text-slate-500 text-xs leading-relaxed">
                                This credential has been cryptographically validated and registered by Sapience LMS. 
                                Secure verification is guaranteed through unique identifier matching.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
