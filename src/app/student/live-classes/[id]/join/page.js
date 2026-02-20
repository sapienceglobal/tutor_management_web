'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';

export default function JoinLiveClassPage({ params }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classData, setClassData] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Class Details (Reusing join-config primarily for user/class checking)
                // We'll just fetch the class directly or use the join-config endpoint if it returns the needed basics
                // But join-config was Zoom specific. Let's try fetching the class detail directly if possible, 
                // OR ideally create a generic 'join-auth' endpoint. 
                // For speed, let's assume valid user is logged in (middleware checks) and we fetch class details.

                // We can use the existing /join-config route but we modified the backend controller to return config.
                // In Jitsi case, we just need room name (meetingId) and user details.
                // The current controller's getJoinConfig likely returns config object differently now?
                // Actually, I haven't updated getJoinConfig in the backend yet! I only updated createLiveClass.
                // I need to update getJoinConfig to return Jitsi details.

                // Let's assume getJoinConfig returns { config: { meetingNumber: 'RoomName', userName: '...' } }
                // I will update backend getJoinConfig next.

                const res = await api.post(`/live-classes/${id}/join-config`);
                if (res.data.success) {
                    setClassData(res.data.config);
                    // config contains: meetingNumber (RoomID), userName, userEmail
                }
            } catch (err) {
                console.error('Failed to join:', err);
                setError(err.response?.data?.message || 'Failed to load class');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Preparing Global Classroom...</p>
            </div>
        );
    }

    if (error || !classData) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white">
                <h2 className="text-xl font-bold text-red-500 mb-2">Unavailable</h2>
                <p>{error || 'Class data not found'}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-black">
            {/* Header */}
            <div className="absolute top-4 left-4 z-50">
                <Button
                    variant="secondary"
                    className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm border border-white/10"
                    onClick={() => router.push('/student/live-classes')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Leave Class
                </Button>
            </div>

            <JitsiMeeting
                domain="meet.jit.si"
                roomName={classData.meetingNumber} // Use the meetingId as Room Name
                configOverwrite={{
                    startWithAudioMuted: true,
                    disableThirdPartyRequests: true,
                    prejoinPageEnabled: false,
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
                    email: classData.userEmail
                }}
                onApiReady={(externalApi) => {
                    // here you can attach custom event listeners to the Jitsi Meet External API
                    // e.g., externalApi.addEventListeners({ ... });
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                }}
            />
        </div>
    );
}
