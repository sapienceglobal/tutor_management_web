'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdVpnKey, MdVideocam, MdCreditCard, MdCloud, MdAutoAwesome, 
    MdSave, MdSecurity, MdVisibility, MdVisibilityOff, MdWarning 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

// ─── Base Input Style ─────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function SuperAdminIntegrationsPage() {
    const [activeTab, setActiveTab] = useState('zoom');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecret, setShowSecret] = useState(false);

    // Zoom State
    const [zoomConfig, setZoomConfig] = useState({
        accountId: '',
        clientId: '',
        clientSecret: '', // Always empty on load for security
        isEnabled: false,
        hasSecret: false // Comes from backend to show '••••••••' placeholder
    });

    useEffect(() => {
        if (activeTab === 'zoom') fetchZoomConfig();
    }, [activeTab]);

    const fetchZoomConfig = async () => {
        setLoading(true);
        try {
            const res = await api.get('/superadmin/integrations/zoom');
            if (res.data.success && res.data.data) {
                setZoomConfig({
                    ...res.data.data,
                    clientSecret: '' // Keep input empty
                });
            }
        } catch (error) {
            toast.error('Failed to load Zoom configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleZoomChange = (e) => {
        const { name, value, type, checked } = e.target;
        setZoomConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveZoom = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Only send what is needed
            const payload = {
                accountId: zoomConfig.accountId,
                clientId: zoomConfig.clientId,
                isEnabled: zoomConfig.isEnabled,
            };
            
            // Only send secret if it was changed
            if (zoomConfig.clientSecret.trim() !== '') {
                payload.clientSecret = zoomConfig.clientSecret;
            }

            const res = await api.put('/superadmin/integrations/zoom', payload);
            if (res.data.success) {
                toast.success(res.data.message);
                setZoomConfig(prev => ({ ...prev, clientSecret: '', hasSecret: true }));
            }
        } catch (error) {
            toast.error('Failed to save Zoom keys');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'zoom', label: 'Zoom Meetings', icon: MdVideocam, color: C.btnPrimary },
        { id: 'payment', label: 'Payment Gateways', icon: MdCreditCard, color: C.success },
        { id: 'storage', label: 'Cloud Storage', icon: MdCloud, color: C.warning },
        { id: 'ai', label: 'AI Models', icon: MdAutoAwesome, color: '#8B5CF6' },
    ];

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdVpnKey style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            API Integrations
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Manage global API keys, secrets, and third-party webhooks securely.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* ── Sidebar Navigation ── */}
                <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center justify-between transition-all border-none cursor-pointer text-left"
                                style={{
                                    padding: '16px 20px',
                                    borderRadius: '10px',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold,
                                    backgroundColor: isActive ? C.btnPrimary : C.cardBg,
                                    color: isActive ? '#ffffff' : C.text,
                                    boxShadow: isActive ? S.btn : S.card,
                                    border: isActive ? 'none' : `1px solid ${C.cardBorder}`
                                }}
                            >
                                <span className="flex items-center gap-3">
                                    <Icon style={{ width: 18, height: 18, color: isActive ? '#ffffff' : tab.color }} /> 
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Main Content Area ── */}
                <div className="flex-1 overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    
                    {/* ── Tab: ZOOM CONFIG ── */}
                    {activeTab === 'zoom' && (
                        <div className="animate-in fade-in duration-500">
                            
                            {/* Inner Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 md:p-8" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                <div>
                                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '4px' }}>
                                        Zoom Server-to-Server OAuth
                                    </h2>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                        Used for auto-generating live classes globally.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2" style={{ backgroundColor: C.successBg, padding: '8px 16px', borderRadius: '10px', border: `1px solid ${C.successBorder}` }}>
                                    <MdSecurity style={{ width: 18, height: 18, color: C.success }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.success }}>AES-256 Encrypted</span>
                                </div>
                            </div>

                            <div className="p-6 md:p-8">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                                        <div className="relative w-12 h-12">
                                            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                                            Loading configuration...
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveZoom} className="space-y-6 max-w-3xl">
                                        
                                        {/* Enable Toggle */}
                                        <div className="flex items-center justify-between p-5" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                            <div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Enable Zoom Integration</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>Allow tutors to schedule Zoom meetings.</p>
                                            </div>
                                            <div 
                                                onClick={() => handleZoomChange({ target: { name: 'isEnabled', type: 'checkbox', checked: !zoomConfig.isEnabled }})}
                                                style={{ 
                                                    width: 44, height: 24, borderRadius: '9999px', backgroundColor: zoomConfig.isEnabled ? C.btnPrimary : '#D1D5DB', 
                                                    position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' 
                                                }}
                                            >
                                                <div style={{
                                                    position: 'absolute', top: 2, left: zoomConfig.isEnabled ? 22 : 2,
                                                    width: 20, height: 20, backgroundColor: '#ffffff', borderRadius: '50%',
                                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Credentials */}
                                        <div className="grid grid-cols-1 gap-6 pt-2">
                                            <div className="flex flex-col gap-2">
                                                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                    Account ID
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="accountId" 
                                                    value={zoomConfig.accountId} 
                                                    onChange={handleZoomChange} 
                                                    placeholder="e.g. XyZ123abc..." 
                                                    style={baseInputStyle} 
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col gap-2">
                                                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                    Client ID
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="clientId" 
                                                    value={zoomConfig.clientId} 
                                                    onChange={handleZoomChange} 
                                                    placeholder="Enter Client ID" 
                                                    style={baseInputStyle} 
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2 relative">
                                                <div className="flex justify-between items-center">
                                                    <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                        Client Secret
                                                    </label>
                                                    {zoomConfig.hasSecret && (
                                                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.bold, backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }}>
                                                            Secret Saved Securely
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        type={showSecret ? 'text' : 'password'} 
                                                        name="clientSecret" 
                                                        value={zoomConfig.clientSecret} 
                                                        onChange={handleZoomChange} 
                                                        placeholder={zoomConfig.hasSecret ? '••••••••••••••••••••••••' : 'Enter Client Secret'} 
                                                        style={{ ...baseInputStyle, paddingRight: '48px', fontFamily: T.fontFamilyMono }} 
                                                    />
                                                    <button type="button" onClick={() => setShowSecret(!showSecret)} 
                                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: C.textFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {showSecret ? <MdVisibilityOff style={{ width: 18, height: 18 }}/> : <MdVisibility style={{ width: 18, height: 18 }}/>}
                                                    </button>
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>
                                                    Leave blank if you do not want to change the existing secret.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button 
                                                type="submit" 
                                                disabled={saving} 
                                                className="flex items-center gap-2 transition-opacity"
                                                style={{
                                                    background: saving ? C.cardBorder : C.gradientBtn,
                                                    color: '#ffffff',
                                                    fontFamily: T.fontFamily,
                                                    fontSize: T.size.base,
                                                    fontWeight: T.weight.bold,
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    padding: '12px 32px',
                                                    cursor: saving ? 'not-allowed' : 'pointer',
                                                    boxShadow: saving ? 'none' : S.btn
                                                }}
                                            >
                                                {saving ? <MdHourglassEmpty style={{ width: 18, height: 18 }} className="animate-spin" /> : <MdSave style={{ width: 18, height: 18 }} />}
                                                Save Credentials
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Placeholders for Future Tabs ── */}
                    {activeTab !== 'zoom' && (
                        <div className="p-14 text-center border border-dashed m-6 md:m-8" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                            <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdWarning style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0, marginBottom: 8 }}>
                                Module Not Configured
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: '0 auto', maxWidth: '400px', lineHeight: T.leading.normal }}>
                                This integration is currently locked. Connect the respective Mongoose schema to activate this panel.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}