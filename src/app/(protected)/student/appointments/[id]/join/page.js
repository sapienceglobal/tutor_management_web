'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { Loader2, ArrowLeft, VideoOff } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { T } from '@/constants/studentTokens';

const ZoomMeetingEmbed = dynamic(
    () => import('@/components/shared/ZoomMeetingEmbed'),
    { ssr: false }
);

export default function JoinAppointmentPage({ params }) {
    const { id } = use(params);
    const router  = useRouter();

    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [meetingData, setMeetingData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.post(`/appointments/${id}/join-config`);
                if (res.data?.success) {
                    const data = res.data.config;
                    if (data.platform === 'external') {
                        window.open(data.meetingLink, '_blank');
                        router.back();
                        return;
                    }
                    setMeetingData(data);
                }
            } catch (err) {
                console.error('Failed to join:', err);
                setError(err.response?.data?.message || 'Failed to load appointment details');
            } finally { setLoading(false); }
        };
        fetchData();
    }, [id, router]);

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#111827' }}>
            <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#9CA3AF' }}>Preparing Virtual Session...</p>
        </div>
    );

    if (error || !meetingData) return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#111827' }}>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                <VideoOff className="w-8 h-8 text-red-500" />
            </div>
            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#F87171' }}>Session Unavailable</h2>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#9CA3AF', maxWidth: '300px', textAlign: 'center' }}>{error || 'Appointment data not found or session has ended.'}</p>
            <button onClick={() => router.back()}
                className="mt-6 px-6 h-11 border border-white/20 rounded-xl text-white transition-colors hover:bg-white/10 cursor-pointer"
                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                Go Back
            </button>
        </div>
    );

    return (
        <div className="h-screen w-full flex flex-col relative" style={{ backgroundColor: '#000' }}>
            
            {/* Cinematic Glass Header */}
            <div className="absolute top-6 left-6 z-50 pointer-events-auto">
                <button
                    onClick={() => router.push('/student/appointments')}
                    className="flex items-center gap-2 px-5 h-11 rounded-2xl text-white transition-all cursor-pointer shadow-lg"
                    style={{ 
                        backgroundColor: 'rgba(0,0,0,0.6)', 
                        border: '1px solid rgba(255,255,255,0.15)', 
                        backdropFilter: 'blur(12px)', 
                        fontFamily: T.fontFamily, 
                        fontSize: T.size.sm, 
                        fontWeight: T.weight.bold 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
                    <ArrowLeft size={16} /> Leave Session
                </button>
            </div>

            <div className="flex-1 w-full relative z-10">
                {meetingData.platform === 'zoom' ? (
                    <ZoomMeetingEmbed
                        config={meetingData}
                        onLeave={() => router.push('/student/appointments')}
                        sessionLabel="Appointment"
                    />
                ) : (
                    <JitsiMeeting
                        domain="meet.jit.si"
                        roomName={meetingData.meetingNumber}
                        configOverwrite={{
                            startWithAudioMuted:       true,
                            disableThirdPartyRequests: true,
                            prejoinPageEnabled:        false,
                        }}
                        interfaceConfigOverwrite={{
                            TOOLBAR_BUTTONS: [
                                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                                'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                                'security'
                            ],
                        }}
                        userInfo={{
                            displayName: meetingData.userName || 'Student',
                            email:       meetingData.userEmail,
                        }}
                        onApiReady={() => {}}
                        getIFrameRef={(iframeRef) => {
                            iframeRef.style.height = '100%';
                            iframeRef.style.width  = '100%';
                            iframeRef.style.border = 'none';
                        }}
                    />
                )}
            </div>
        </div>
    );
}
