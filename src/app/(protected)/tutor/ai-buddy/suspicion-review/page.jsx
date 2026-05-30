'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SuspicionReviewIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/tutor/ai-buddy/proctoring');
    }, [router]);

    return (
        <div className="h-full flex flex-col items-center justify-center bg-[#F5F3FF]">
            <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED] mb-4" />
            <p className="text-slate-500 font-semibold text-sm">Redirecting to Proctoring Alerts...</p>
        </div>
    );
}
