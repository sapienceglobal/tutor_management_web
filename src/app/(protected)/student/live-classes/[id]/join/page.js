'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, ArrowLeft } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { T } from '@/constants/studentTokens';

export default function JoinLiveClassPage({ params }) {
    const { id } = use(params);
    const router  = useRouter();

    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [classData, setClassData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.post(`/live-classes/${id}/join-config`);
                if (res.data.success) setClassData(res.data.config);
            } catch (err) {
                console.error('Failed to join:', err);
                setError(err.response?.data?.message || 'Failed to load class');
            } finally { setLoading(false); }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white gap-4"
            style={{ fontFamily: T.fontFamily }}>
            <Loader2 className="w-8 h-8 animate-spin" />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm }}>Preparing Global Classroom...</p>
        </div>
    );

    if (error || !classData) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white gap-4"
            style={{ fontFamily: T.fontFamily }}>
            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: '#f87171' }}>
                Unavailable
            </h2>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm }}>{error || 'Class data not found'}</p>
            <button onClick={() => router.back()}
                className="mt-2 px-5 py-2.5 border border-white/20 rounded-xl text-white transition-colors hover:bg-white/10"
                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                Go Back
            </button>
        </div>
    );

    return (
        <div className="h-screen w-full flex flex-col bg-black">
            {/* Header */}
            <div className="absolute top-4 left-4 z-50">
                <button
                    onClick={() => router.push('/student/live-classes')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-colors"
                    style={{ backgroundColor: 'rgba(0,0,0,0.50)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.70)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.50)'; }}>
                    <ArrowLeft className="w-4 h-4" />
                    Leave Class
                </button>
            </div>

            <JitsiMeeting
                domain="meet.jit.si"
                roomName={classData.meetingNumber}
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
                    displayName: classData.userName || 'Student',
                    email:       classData.userEmail,
                }}
                onApiReady={(externalApi) => {}}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width  = '100%';
                }}
            />
        </div>
    );
}