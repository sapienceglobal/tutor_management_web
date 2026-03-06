import { useState, useEffect } from 'react';
import api from '@/lib/axios';

/**
 * Hook to get current institute information
 * Provides institute-specific data isolation
 */
export default function useInstitute() {
    const [institute, setInstitute] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstitute = async () => {
            try {
                // Use the correct endpoint that works for all user types
                const response = await api.get('/user-institute/me');
                
                if (response.data?.success) {
                    setInstitute(response.data.institute);
                }
            } catch (error) {
                console.error('useInstitute - Failed to fetch institute:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitute();
    }, []);

    return { institute, loading };
}
