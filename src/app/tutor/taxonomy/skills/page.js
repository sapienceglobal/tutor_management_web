'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { format } from 'date-fns';

export default function SkillsPage() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const res = await api.get('/taxonomy/skills');
            if (res.data.success) {
                setSkills(res.data.skills);
            }
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSkills = skills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Skills</h1>
                    <p className="text-sm text-slate-500">Manage competencies and proficiencies for granular tracking.</p>
                </div>
                <Link href="/tutor/taxonomy/skills/create">
                    <Button className="bg-[#3b0d46] hover:bg-[#2a0933]">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Skill
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="border-b pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">All Skills</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search skills..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 flex justify-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : filteredSkills.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <BrainCircuit className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p>No skills found.</p>
                            <p className="text-sm mt-1">Create skills to track specific student competencies.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-4">Skill Name</th>
                                        <th className="px-6 py-4">Created Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSkills.map((skill) => (
                                        <tr key={skill._id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {skill.name}
                                                {skill.description && (
                                                    <p className="text-xs text-slate-500 mt-1 font-normal line-clamp-1">{skill.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {format(new Date(skill.createdAt), 'MMM d, yyyy')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
