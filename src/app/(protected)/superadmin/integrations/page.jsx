'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, Key, Video, CreditCard, Cloud, BrainCircuit, 
    Save, ShieldCheck, Eye, EyeOff, AlertTriangle 
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

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

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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
        { id: 'zoom', label: 'Zoom Meetings', icon: Video, color: 'text-blue-500' },
        { id: 'payment', label: 'Payment Gateways', icon: CreditCard, color: 'text-emerald-500' },
        { id: 'storage', label: 'Cloud Storage', icon: Cloud, color: 'text-orange-500' },
        { id: 'ai', label: 'AI Models', icon: BrainCircuit, color: 'text-purple-500' },
    ];

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <Key className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">API Integrations</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Manage global API keys, secrets, and third-party webhooks securely.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-[13px] transition-all border-none cursor-pointer text-left ${
                                    isActive ? 'bg-[#27225B] text-white shadow-lg' : 'bg-white text-[#7D8DA6] hover:bg-[#F9F7FC]'
                                }`}
                            >
                                <span className="flex items-center gap-3">
                                    <Icon size={18} className={isActive ? 'text-white' : tab.color} /> 
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-[24px] border border-[#E9DFFC] p-6 md:p-8" style={{ boxShadow: softShadow }}>
                    
                    {/* ── Tab: ZOOM CONFIG ── */}
                    {activeTab === 'zoom' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F4F0FD] pb-6">
                                <div>
                                    <h2 className="text-[18px] font-black text-[#27225B] flex items-center gap-2 m-0 mb-1">
                                        Zoom Server-to-Server OAuth
                                    </h2>
                                    <p className="text-[12px] font-medium text-[#7D8DA6] m-0">Used for auto-generating live classes globally.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-[#ECFDF5] px-4 py-2 rounded-xl border border-[#D1FAE5]">
                                    <ShieldCheck size={18} className="text-[#10B981]" />
                                    <span className="text-[12px] font-bold text-[#10B981]">AES-256 Encrypted</span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6B4DF1]"/></div>
                            ) : (
                                <form onSubmit={handleSaveZoom} className="space-y-5 max-w-3xl">
                                    
                                    {/* Enable Toggle */}
                                    <div className="flex items-center justify-between p-5 bg-[#F9F7FC] border border-[#E9DFFC] rounded-2xl">
                                        <div>
                                            <p className="text-[14px] font-black text-[#27225B] m-0">Enable Zoom Integration</p>
                                            <p className="text-[11px] text-[#7D8DA6] font-medium mt-1 m-0">Allow tutors to schedule Zoom meetings.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="isEnabled" checked={zoomConfig.isEnabled} onChange={handleZoomChange} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6B4DF1]"></div>
                                        </label>
                                    </div>

                                    {/* Credentials */}
                                    <div className="grid grid-cols-1 gap-5 pt-2">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[12px] font-bold text-[#4A5568] uppercase tracking-wider">Account ID</label>
                                            <input type="text" name="accountId" value={zoomConfig.accountId} onChange={handleZoomChange} placeholder="e.g. XyZ123abc..." 
                                                className="px-4 py-3.5 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" />
                                        </div>
                                        
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[12px] font-bold text-[#4A5568] uppercase tracking-wider">Client ID</label>
                                            <input type="text" name="clientId" value={zoomConfig.clientId} onChange={handleZoomChange} placeholder="Enter Client ID" 
                                                className="px-4 py-3.5 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" />
                                        </div>

                                        <div className="flex flex-col gap-1.5 relative">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[12px] font-bold text-[#4A5568] uppercase tracking-wider">Client Secret</label>
                                                {zoomConfig.hasSecret && <span className="text-[10px] font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded">Secret Saved Securely</span>}
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type={showSecret ? 'text' : 'password'} 
                                                    name="clientSecret" 
                                                    value={zoomConfig.clientSecret} 
                                                    onChange={handleZoomChange} 
                                                    placeholder={zoomConfig.hasSecret ? '••••••••••••••••••••••••' : 'Enter Client Secret'} 
                                                    className="w-full pl-4 pr-12 py-3.5 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all font-mono" 
                                                />
                                                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0ABC0] hover:text-[#6B4DF1] bg-transparent border-none cursor-pointer">
                                                    {showSecret ? <EyeOff size={18}/> : <Eye size={18}/>}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-[#A0ABC0] font-medium m-0 mt-1">Leave blank if you do not want to change the existing secret.</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#27225B] hover:bg-[#1e1a48] text-white text-[13px] font-bold rounded-xl transition-all shadow-lg disabled:opacity-60 border-none cursor-pointer">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Credentials
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* ── Placeholders for Future Tabs ── */}
                    {activeTab !== 'zoom' && (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center animate-in fade-in duration-300">
                            <div className="w-20 h-20 bg-[#F9F7FC] rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-10 h-10 text-[#D1C4F9]" />
                            </div>
                            <h2 className="text-[20px] font-black text-[#27225B] m-0 mb-2">Module Not Configured</h2>
                            <p className="text-[13px] text-[#7D8DA6] font-medium max-w-sm m-0">
                                This integration is currently locked. Connect the respective Mongoose schema to activate this panel.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}