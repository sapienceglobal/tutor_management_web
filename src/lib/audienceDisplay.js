const SCOPE_META = {
    global: {
        label: 'Global',
        badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200',
        reason: 'Visible because this is global content.',
    },
    institute: {
        label: 'Institute',
        badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200',
        reason: 'Visible because you are in the same institute.',
    },
    batch: {
        label: 'Batch',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        reason: 'Visible because you are in the target batch.',
    },
    private: {
        label: 'Private',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
        reason: 'Visible because tutor added you directly.',
    },
};

const getScopeFromLegacy = (resource) => {
    if (!resource || typeof resource !== 'object') return 'global';

    const visibilityScope = String(resource.visibilityScope || '').toLowerCase();
    const visibility = String(resource.visibility || '').toLowerCase();
    if (visibilityScope === 'private') return 'private';
    if (visibilityScope === 'institute') return 'institute';
    if (resource.batchId || (Array.isArray(resource.batchIds) && resource.batchIds.length > 0)) return 'batch';
    if (visibility === 'public' || visibilityScope === 'global' || !resource.instituteId) return 'global';
    return 'institute';
};

export const getAudienceScope = (resource) => {
    const scope = String(resource?.audience?.scope || '').toLowerCase();
    if (SCOPE_META[scope]) return scope;
    return getScopeFromLegacy(resource);
};

export const getAudienceDisplay = (resource) => {
    const scope = getAudienceScope(resource);
    const meta = SCOPE_META[scope] || SCOPE_META.global;
    return {
        scope,
        label: meta.label,
        badgeClass: meta.badgeClass,
        reason: meta.reason,
    };
};
