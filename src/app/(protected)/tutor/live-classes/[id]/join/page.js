'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { Loader2, ArrowLeft, VideoOff } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { T } from '@/constants/studentTokens';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'react-hot-toast';

const ZoomMeetingEmbed = dynamic(
    () => import('@/components/shared/ZoomMeetingEmbed'),
    { ssr: false }
);

export default function TutorJoinLiveClassPage({ params }) {
    const { id } = use(params);
    const router  = useRouter();
    const { socket } = useSocket();

    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [classData, setClassData] = useState(null);

    useEffect(() => {
        if (!socket || !id || !classData) return;

        // Register joining
        socket.emit('join_live_class', { liveClassId: id });

        // Handle force disconnect from SuperAdmin
        const handleForceKill = (data) => {
            if (data.liveClassId === id) {
                toast.error('This live class has been terminated by the SuperAdmin.');
                router.push('/tutor/live-classes');
            }
        };

        socket.on('live_class_force_killed', handleForceKill);

        return () => {
            socket.emit('leave_live_class', { liveClassId: id });
            socket.off('live_class_force_killed', handleForceKill);
        };
    }, [socket, id, classData, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.post(`/live-classes/${id}/join-config`);
                if (res.data?.success) setClassData(res.data.config);
            } catch (err) {
                console.error('Failed to load class configuration:', err);
                setError(err.response?.data?.message || 'Failed to load class');
            } finally { setLoading(false); }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#111827' }}>
            <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#9CA3AF' }}>Preparing Tutor Virtual Classroom...</p>
        </div>
    );

    if (error || !classData) return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#111827' }}>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                <VideoOff className="w-8 h-8 text-red-500" />
            </div>
            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#F87171' }}>Class Session Error</h2>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#9CA3AF', maxWidth: '350px', textAlign: 'center' }}>{error || 'Class details not found.'}</p>
            <button onClick={() => router.push('/tutor/live-classes')}
                className="mt-6 px-6 h-11 border border-white/20 rounded-xl text-white transition-colors hover:bg-white/10 cursor-pointer"
                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                Back to Scheduling Page
            </button>
        </div>
    );

    // For Zoom, ZoomMeetingEmbed already renders its own "Leave class" /
    // "Menu" floating controls (positioned to clear Zoom's own toolbar),
    // so this page-level back button is only needed for the Jitsi path.
    const isZoom = classData.platform === 'zoom';

    return (
        <div className="h-screen w-full flex flex-col relative" style={{ backgroundColor: '#000' }}>

            {!isZoom && (
                /* Cinematic Glass Header — only for Jitsi, which doesn't
                   have its own corner toolbar in the same spot Zoom does. */
                <div className="absolute top-6 left-6 z-50 pointer-events-auto">
                    <button
                        onClick={() => router.push('/tutor/live-classes')}
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
                        <ArrowLeft size={16} /> End & Exit Session
                    </button>
                </div>
            )}

            <div className="flex-1 w-full h-full relative z-10">
                {isZoom ? (
                    <ZoomMeetingEmbed
                        config={classData}
                        onLeave={() => router.push('/tutor/live-classes')}
                        sessionLabel="Live Class"
                    />
                ) : (
                    <JitsiMeeting
                        domain="meet.jit.si"
                        roomName={classData.meetingNumber}
                        configOverwrite={{
                            startWithAudioMuted:       false,
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
                            displayName: classData.userName || 'Tutor',
                            email:       classData.userEmail,
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