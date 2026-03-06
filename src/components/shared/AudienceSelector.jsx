'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const defaultAudience = {
    scope: 'institute',
    instituteId: null,
    batchIds: [],
    studentIds: [],
};

const dedupe = (arr = []) => [...new Set((arr || []).filter(Boolean))];

export default function AudienceSelector({
    value = defaultAudience,
    onChange,
    availableBatches = [],
    availableStudents = [],
    allowGlobal = true,
    allowPrivate = true,
    instituteId = null,
    className = '',
}) {
    const audience = { ...defaultAudience, ...value };

    const updateAudience = (patch) => {
        const next = {
            ...audience,
            ...patch,
        };
        next.batchIds = dedupe(next.batchIds);
        next.studentIds = dedupe(next.studentIds);
        if (next.scope !== 'batch') next.batchIds = [];
        if (next.scope !== 'private') next.studentIds = [];
        if (next.scope === 'global') next.instituteId = null;
        if ((next.scope === 'institute' || next.scope === 'batch' || next.scope === 'private') && !next.instituteId) {
            next.instituteId = instituteId || null;
        }
        onChange(next);
    };

    const toggleArrayValue = (key, id) => {
        const list = Array.isArray(audience[key]) ? audience[key] : [];
        const exists = list.includes(id);
        updateAudience({
            [key]: exists ? list.filter((entry) => entry !== id) : [...list, id],
        });
    };

    return (
        <div className={`space-y-4 rounded-xl border border-slate-200 bg-white/60 p-4 ${className}`}>
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Audience Scope</Label>
                <Select
                    value={audience.scope}
                    onValueChange={(scope) => updateAudience({ scope })}
                >
                    <SelectTrigger className="h-11 bg-white">
                        <SelectValue placeholder="Select audience scope" />
                    </SelectTrigger>
                    <SelectContent>
                        {allowGlobal && <SelectItem value="global">Global</SelectItem>}
                        <SelectItem value="institute">Institute</SelectItem>
                        <SelectItem value="batch">Batch</SelectItem>
                        {allowPrivate && <SelectItem value="private">Private</SelectItem>}
                    </SelectContent>
                </Select>
            </div>

            {audience.scope === 'batch' && (
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">Target Batches</Label>
                    {availableBatches.length === 0 && (
                        <p className="text-xs text-slate-500">No batches found. Create batches first to use batch scope.</p>
                    )}
                    <div className="space-y-2">
                        {availableBatches.map((batch) => (
                            <label key={batch._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                <span>{batch.name}</span>
                                <Switch
                                    checked={audience.batchIds.includes(batch._id)}
                                    onCheckedChange={() => toggleArrayValue('batchIds', batch._id)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {audience.scope === 'private' && (
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">Target Students</Label>
                    {availableStudents.length === 0 && (
                        <p className="text-xs text-slate-500">No enrolled students found for private targeting.</p>
                    )}
                    <div className="max-h-52 space-y-2 overflow-auto pr-1">
                        {availableStudents.map((student) => (
                            <label key={student._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                <span>{student.name || student.email || 'Student'}</span>
                                <Switch
                                    checked={audience.studentIds.includes(student._id)}
                                    onCheckedChange={() => toggleArrayValue('studentIds', student._id)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
