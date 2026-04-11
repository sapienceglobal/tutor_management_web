import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsChart({ data, title = "Course Performance" }) {
    // Exact colors from your image
    const colors = { 
        enrollments: '#6854F3', // Purple
        completions: '#4ABCA8', // Green
        revenue: '#FC8730'      // Orange
    };

    const chartData = data || [
        { name: 'Week 1', enrollments: 10, completions: 10, revenue: 15 },
        { name: 'Week 2', enrollments: 80, completions: 80, revenue: 140 },
        { name: 'Week 3', enrollments: 180, completions: 120, revenue: 120 },
        { name: 'Week 4', enrollments: 280, completions: 200, revenue: 280 },
    ];

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.15)';

    return (
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: softShadow }}>
            
            {/* Top Row: Title + Toggle */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-black text-[#27225B] m-0">{title}</h3>
                
                {/* Weekly / Monthly Toggle */}
                <div className="flex items-center bg-[#F4F0FD] rounded-xl p-1">
                    <button className="px-4 py-1.5 text-[13px] font-bold text-[#6854F3] bg-white rounded-lg shadow-sm border-none cursor-pointer transition-all">
                        Weekly
                    </button>
                    <button className="px-4 py-1.5 text-[13px] font-bold text-[#7D8DA6] bg-transparent border-none cursor-pointer transition-all hover:text-[#6854F3]">
                        Monthly
                    </button>
                </div>
            </div>

            {/* Second Row: Legend (Aligned Left) */}
            <div className="flex items-center gap-6 mb-6 pl-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.enrollments }}></span>
                    <span className="text-[13px] font-bold text-[#27225B]">Enrollments</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.completions }}></span>
                    <span className="text-[13px] font-bold text-[#27225B]">Completions</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.revenue }}></span>
                    <span className="text-[13px] font-bold text-[#27225B]">Revenue</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.enrollments} stopOpacity={0.25}/>
                                <stop offset="95%" stopColor={colors.enrollments} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.completions} stopOpacity={0.25}/>
                                <stop offset="95%" stopColor={colors.completions} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.revenue} stopOpacity={0.15}/>
                                <stop offset="95%" stopColor={colors.revenue} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} dx={-10} />
                        
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: softShadow, fontWeight: 'bold', color: '#27225B' }}
                            cursor={{ stroke: '#E5E7EB', strokeWidth: 2, strokeDasharray: '3 3' }} 
                        />
                        
                        {/* Lines with White-centered Dots like the image */}
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={colors.revenue} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            dot={{ r: 5, stroke: colors.revenue, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 7, stroke: colors.revenue, strokeWidth: 2, fill: '#fff' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="completions" 
                            stroke={colors.completions} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorCompletions)" 
                            dot={{ r: 5, stroke: colors.completions, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 7, stroke: colors.completions, strokeWidth: 2, fill: '#fff' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="enrollments" 
                            stroke={colors.enrollments} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorEnrollments)" 
                            dot={{ r: 5, stroke: colors.enrollments, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 7, stroke: colors.enrollments, strokeWidth: 2, fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}