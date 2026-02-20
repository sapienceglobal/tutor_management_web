'use client';

export default function FeedbackWidget({ title, data }) {
    const defaultData = [
        { label: 'Good', value: 78, color: 'bg-green-500' },
        { label: 'Satisfied', value: 82, color: 'bg-blue-600' },
        { label: 'Excellent', value: 89, color: 'bg-orange-500' },
        { label: 'Average', value: 40, color: 'bg-yellow-500' },
        { label: 'Unsatisfied', value: 20, color: 'bg-cyan-400' },
    ];

    const displayData = data || defaultData;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-8">{title || 'Customer Satisfaction'}</h3>

            <div className="space-y-6">
                {displayData.map((item, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-slate-600 font-medium">{item.label}</span>
                            <span className="text-slate-500">{item.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                                style={{ width: `${item.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
