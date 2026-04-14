'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api'; // Tumhara existing API instance

// Context create kar rahe hain
const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const [features, setFeatures] = useState({});
    const [planName, setPlanName] = useState('');
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            // Assuming tumhara /auth/me ya koi similar route user aur institute details deta hai
            const { data } = await api.get('/auth/me'); 
            
            if (data.success && data.user) {
                setRole(data.user.role);
                
                // Agar user kisi institute se juda hai
                if (data.user.instituteId) {
                    // Populate ho kar features aate hain
                    setFeatures(data.user.instituteId.features || {});
                    setPlanName(data.user.instituteId.subscriptionPlan || 'Free');
                }
            }
        } catch (error) {
            console.error("Failed to fetch subscription context", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();
    }, []);

    // 🌟 MASTER FUNCTION: Ye check karega ki feature available hai ya nahi
    const hasFeature = (featureKey) => {
        // Superadmin ke liye saare taale (locks) khule hain!
        if (role === 'superadmin') return true;
        
        // Check karo ki feature true hai ya nahi
        return features[featureKey] === true;
    };

    return (
        <SubscriptionContext.Provider value={{ 
            features, 
            planName, 
            role, 
            loading, 
            hasFeature,
            refreshSubscription: fetchSubscriptionData 
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

// Custom hook banaya taaki ise use karna aasan ho
export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error("useSubscription must be used within a SubscriptionProvider");
    }
    return context;
};