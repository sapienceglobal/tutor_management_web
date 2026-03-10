'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePracticeSetPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/tutor/quizzes/create?type=practice');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">Redirecting to quiz creator...</p>
            </div>
        </div>
    );
}
