'use client';

import { Switch } from '@/components/ui/switch';
import { C, T, R, S } from '@/constants/tutorTokens';
import { ChevronRight } from 'lucide-react';

// ── Page-specific colors (same as CreateCoursePage) ───────────────────────────
const outerCard = '#EAE8FA';
const innerBox  = '#E3DFF8';

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
        const next = { ...audience, ...patch };
        next.batchIds   = dedupe(next.batchIds);
        next.studentIds = dedupe(next.studentIds);
        if (next.scope !== 'batch')   next.batchIds   = [];
        if (next.scope !== 'private') next.studentIds = [];
        if (next.scope === 'global')  next.instituteId = null;
        if (['institute', 'batch', 'private'].includes(next.scope) && !next.instituteId) {
            next.instituteId = instituteId || null;
        }
        onChange(next);
    };

    const toggleArrayValue = (key, id) => {
        const list   = Array.isArray(audience[key]) ? audience[key] : [];
        const exists = list.includes(id);
        updateAudience({ [key]: exists ? list.filter(e => e !== id) : [...list, id] });
    };

    const scopeOptions = [
        ...(allowGlobal  ? [{ value: 'global',    label: 'Global'    }] : []),
        { value: 'institute', label: 'Institute' },
        { value: 'batch',     label: 'Batch'     },
        ...(allowPrivate ? [{ value: 'private',   label: 'Private'   }] : []),
    ];

    return (
        <div className={className}
            style={{
                backgroundColor: outerCard,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: R.xl,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
            }}>

            {/* ── Audience Scope label ── */}
            <div>
                <label style={{
                    display: 'block',
                    fontFamily: T.fontFamily,
                    fontSize: T.size.sm,
                    fontWeight: T.weight.semibold,
                    color: C.text,
                    marginBottom: 8,
                }}>
                    Audience Scope
                </label>

                {/* Custom select — replaces shadcn Select */}
                <div className="relative">
                    <select
                        value={audience.scope}
                        onChange={e => updateAudience({ scope: e.target.value })}
                        style={{
                            width: '100%',
                            height: 44,
                            padding: '0 36px 0 14px',
                            appearance: 'none',
                            cursor: 'pointer',
                            backgroundColor: innerBox,
                            border: '1.5px solid transparent',
                            borderRadius: R.xl,
                            color: C.heading,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.sm,
                            fontWeight: T.weight.medium,
                            outline: 'none',
                        }}
                        onFocus={e => {
                            e.target.style.borderColor = C.btnPrimary;
                            e.target.style.boxShadow  = '0 0 0 3px rgba(117,115,232,0.10)';
                        }}
                        onBlur={e => {
                            e.target.style.borderColor = 'transparent';
                            e.target.style.boxShadow  = 'none';
                        }}>
                        {scopeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none"
                        style={{ color: C.textMuted }} />
                </div>
            </div>

            {/* ── Batch selector ── */}
            {audience.scope === 'batch' && (
                <div>
                    <label style={{
                        display: 'block',
                        fontFamily: T.fontFamily,
                        fontSize: T.size.sm,
                        fontWeight: T.weight.semibold,
                        color: C.text,
                        marginBottom: 8,
                    }}>
                        Target Batches
                    </label>

                    {availableBatches.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            No batches found. Create batches first to use batch scope.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {availableBatches.map(batch => (
                                <label key={batch._id}
                                    className="flex items-center justify-between"
                                    style={{
                                        backgroundColor: innerBox,
                                        border: `1px solid ${C.cardBorder}`,
                                        borderRadius: R.lg,
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                    }}>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, fontWeight: T.weight.medium }}>
                                        {batch.name}
                                    </span>
                                    <Switch
                                        checked={audience.batchIds.includes(batch._id)}
                                        onCheckedChange={() => toggleArrayValue('batchIds', batch._id)}
                                    />
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Private / student selector ── */}
            {audience.scope === 'private' && (
                <div>
                    <label style={{
                        display: 'block',
                        fontFamily: T.fontFamily,
                        fontSize: T.size.sm,
                        fontWeight: T.weight.semibold,
                        color: C.text,
                        marginBottom: 8,
                    }}>
                        Target Students
                    </label>

                    {availableStudents.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            No enrolled students found for private targeting.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {availableStudents.map(student => (
                                <label key={student._id}
                                    className="flex items-center justify-between"
                                    style={{
                                        backgroundColor: innerBox,
                                        border: `1px solid ${C.cardBorder}`,
                                        borderRadius: R.lg,
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                    }}>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, fontWeight: T.weight.medium }}>
                                        {student.name || student.email || 'Student'}
                                    </span>
                                    <Switch
                                        checked={audience.studentIds.includes(student._id)}
                                        onCheckedChange={() => toggleArrayValue('studentIds', student._id)}
                                    />
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}