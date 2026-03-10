'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentLearningPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard as "My Learning" is essentially the student dashboard
        router.replace('/student/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Redirecting to My Learning...</p>
        </div>
    );
}
