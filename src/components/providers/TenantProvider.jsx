'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TenantContext = createContext({
    tenant: null,
    loading: true,
    setTenant: () => { },
});

export function TenantProvider({ children }) {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('tenant');
            if (raw) {
                setTenant(JSON.parse(raw));
            }
        } catch (error) {
            console.error('TenantProvider init error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const value = useMemo(() => ({ tenant, loading, setTenant }), [tenant, loading]);

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

export const useTenant = () => useContext(TenantContext);

export default TenantProvider;
