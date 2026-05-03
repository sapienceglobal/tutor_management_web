'use client';

import { X, Crown, Zap, Video, Palette, Users, Brain, Check } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, currentPlan, plans = [], onUpgrade }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Upgrade Your Plan</h2>
                            <p className="text-slate-600 mt-1">
                                Current plan: <span className="font-semibold">{currentPlan || 'Free'}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrentPlan = plan.name.toLowerCase() === currentPlan?.toLowerCase();
                            
                            return (
                                <div 
                                    key={plan.name}
                                    className={`relative rounded-xl border-2 p-6 transition-all ${
                                        plan.popular 
                                            ? 'border-indigo-200 bg-indigo-50' 
                                            : 'border-slate-200 bg-white'
                                    } ${isCurrentPlan ? 'opacity-75' : ''}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className={`text-xl font-bold ${
                                            plan.color === 'green' ? 'text-green-600' :
                                            plan.color === 'blue' ? 'text-blue-600' :
                                            'text-purple-600'
                                        }`}>
                                            {plan.name}
                                        </h3>
                                        <div className="mt-2 flex items-baseline justify-center gap-1">
                                            <span className="text-3xl font-bold text-slate-800">
                                                ₹{plan.price}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-500">/{plan.billingCycle}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-2">{plan.description || `Unlock ${plan.name} features`}</p>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="text-sm text-slate-700">
                                                {plan.features.maxTutors === -1 ? 'Unlimited' : `Up to ${plan.features.maxTutors}`} Tutors
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="text-sm text-slate-700">
                                                {plan.features.maxStudents === -1 ? 'Unlimited' : `Up to ${plan.features.maxStudents}`} Students
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="text-sm text-slate-700">
                                                {plan.features.storageLimitGB} GB Storage
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 font-semibold text-purple-600">
                                            <Zap className="w-4 h-4 text-purple-600 shrink-0" />
                                            <span className="text-sm">
                                                {plan.features.aiCreditsPerMonth || 0} AI Credits/mo
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onUpgrade(plan._id)}
                                        disabled={isCurrentPlan}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                                            isCurrentPlan
                                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                                                : plan.color === 'green'
                                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                                    : plan.color === 'blue'
                                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : 'Upgrade Now'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Feature Comparison */}
                    <div className="mt-8 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-800 mb-4">Feature Comparison</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Feature</th>
                                        <th className="text-center py-3 px-4 font-semibold text-green-600">Basic</th>
                                        <th className="text-center py-3 px-4 font-semibold text-blue-600">Pro</th>
                                        <th className="text-center py-3 px-4 font-semibold text-purple-600">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4 flex items-center gap-2">
                                            <Video className="w-4 h-4 text-slate-600" />
                                            HLS Streaming
                                        </td>
                                        <td className="py-3 px-4 text-center">❌</td>
                                        <td className="py-3 px-4 text-center">❌</td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4 flex items-center gap-2">
                                            <Palette className="w-4 h-4 text-slate-600" />
                                            Custom Branding
                                        </td>
                                        <td className="py-3 px-4 text-center">❌</td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-slate-600" />
                                            Zoom Integration
                                        </td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4 flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-slate-600" />
                                            AI Features
                                        </td>
                                        <td className="py-3 px-4 text-center">❌</td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                        <td className="py-3 px-4 text-center">✅</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
