'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users, BookOpen, TrendingUp, Filter } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AdminStatsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        userGrowth: [],
        courseCategories: [],
        userDistribution: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats/detailed');
                if (res.data.success) {
                    setData(res.data.charts);
                }
            } catch (error) {
                console.error('Failed to fetch detailed stats:', error);
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Analytics Overview</h1>
                <p className="text-slate-500">Deep dive into platform performance metrics</p>
            </div>

            {/* Quick Stats Grid can be added here if needed */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            User Growth
                        </h2>
                        <select className="text-sm border-slate-200 rounded-lg p-1 text-slate-600 bg-slate-50">
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="_id"
                                    stroke="#94a3b8"
                                    tickLine={false}
                                    axisLine={false}
                                    padding={{ left: 20, right: 20 }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="New Users"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4, fill: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Course Categories Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                            Course Distribution
                        </h2>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.courseCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="_id"
                                >
                                    {data.courseCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Role Distribution Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        User Distribution by Role
                    </h2>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.userDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#94a3b8" />
                            <YAxis
                                dataKey="_id"
                                type="category"
                                stroke="#94a3b8"
                                width={100}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar
                                dataKey="count"
                                name="Users"
                                fill="#10b981"
                                radius={[0, 4, 4, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
