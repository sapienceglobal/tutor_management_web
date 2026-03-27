'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CalendarCheck2, Video, Users, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, FX, pageStyle } from '@/constants/tutorTokens';

export default function TutorAttendanceHubPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [liveClasses, setLiveClasses] = useState([]);
    const [batches, setBatches] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [liveClassesRes, batchesRes] = await Promise.all([
                    api.get('/live-classes'),
                    api.get('/batches'),
                ]);
                setLiveClasses(liveClassesRes.data?.liveClasses || []);
                setBatches(batchesRes.data?.batches || batchesRes.data?.data || []);
            } catch {
                toast.error('Failed to load attendance data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const upcomingClasses = useMemo(
        () =>
            liveClasses
                .filter((liveClass) => new Date(liveClass.dateTime) >= new Date())
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
                .slice(0, 6),
        [liveClasses]
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                    Loading attendance hub...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={pageStyle}>
            <div
                className="rounded-2xl px-5 py-4"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}
                    >
                        <CalendarCheck2 className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Attendance
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Check attendance by live class or by student batch
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section
                    className="rounded-2xl p-5 space-y-3"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                >
                    <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" style={{ color: C.btnPrimary }} />
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                            Live Class Attendance
                        </h2>
                    </div>

                    {upcomingClasses.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            No upcoming live classes found. You can still view past class attendance from Live Classes.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {upcomingClasses.map((liveClass) => (
                                <button
                                    key={liveClass._id}
                                    onClick={() => router.push(`/tutor/live-classes/${liveClass._id}/attendance`)}
                                    className="w-full px-3 py-2 rounded-xl border flex items-center justify-between hover:opacity-90 transition-all"
                                    style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}
                                >
                                    <span
                                        className="truncate text-left"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.semibold }}
                                    >
                                        {liveClass.title}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.textMuted }} />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section
                    className="rounded-2xl p-5 space-y-3"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: C.btnPrimary }} />
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                            Batch Attendance
                        </h2>
                    </div>

                    {batches.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            No batches found yet.
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                            {batches.map((batch) => (
                                <button
                                    key={batch._id}
                                    onClick={() => router.push(`/tutor/batches/${batch._id}/attendance`)}
                                    className="w-full px-3 py-2 rounded-xl border flex items-center justify-between hover:opacity-90 transition-all"
                                    style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}
                                >
                                    <span
                                        className="truncate text-left"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.semibold }}
                                    >
                                        {batch.name}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.textMuted }} />
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

