import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { C, T, S } from '@/constants/tutorTokens';

export default function AnalyticsChart({ data, title = "Last Year Overview", isTutor }) {
    // Default data if none provided
    const chartData = data || [
        { name: 'P1-6', students: 24000, enrollments: 31000 },
        { name: 'p1-8', students: 65000, enrollments: 68000 },
        { name: 'p2-6', students: 38000, enrollments: 26000 },
        { name: 'p2-8', students: 42000, enrollments: 41000 },
        { name: 'p3-6', students: 65000, enrollments: 68000 },
        { name: 'p3-8', students: 74000, enrollments: 76000 },
        { name: 'p4-6', students: 66000, enrollments: 38000 },
        { name: 'p4-8', students: 58000, enrollments: 42000 },
        { name: 'p5-6', students: 68000, enrollments: 62000 },
        { name: 'p5-8', students: 76000, enrollments: 72000 },
        { name: 'p6-6', students: 58000, enrollments: 58000 },
        { name: 'p6-8', students: 78000, enrollments: 95000 },
    ];

    const wrapperClass = isTutor ? "p-6 rounded-2xl" : "bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6";
    const wrapperStyle = isTutor ? { backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card } : {};
    const titleStyle = isTutor ? { color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold } : {};
    const titleClass = isTutor ? "mb-6 pb-4 border-b border-slate-200/50" : "text-lg font-semibold text-[#2C3E50] mb-6 pb-4 border-b border-slate-200";

    return (
        <div className={wrapperClass} style={wrapperStyle}>
            <h3 className={titleClass} style={titleStyle}>{title}</h3>

            <div className="h-80" style={isTutor ? { fontFamily: T.fontFamily } : {}}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#F1F5F9"
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isTutor ? C.innerBg : 'white',
                                border: 'none',
                                borderRadius: isTutor ? '12px' : '8px',
                                boxShadow: isTutor ? S.card : '0 4px 12px rgba(0,0,0,0.1)',
                                color: isTutor ? C.text : '#333'
                            }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: '14px'
                            }}
                            iconType="rect"
                            iconSize={12}
                            formatter={(value) => (
                                <span style={{ color: '#7D8DA6', fontWeight: 500 }}>
                                    {value}
                                </span>
                            )}
                        />
                        <Bar
                            dataKey="students"
                            fill={isTutor ? '#3D3B8E' : '#1E3A8A'}
                            name="Website Views"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="enrollments"
                            fill={isTutor ? '#7573E8' : '#FF9F43'}
                            name="New Users"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}