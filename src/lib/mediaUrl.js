const resolveBackendOrigin = () => {
    const rawBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
    if (!rawBase) return '';
    return rawBase.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
};

const BACKEND_ORIGIN = resolveBackendOrigin();
const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const looksLikeMediaPath = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (/^blob:/i.test(trimmed)) return true;
    if (/^data:image\//i.test(trimmed)) return true;
    if (/^https?:\/\//i.test(trimmed)) return true;
    if (/^\/uploads\//i.test(trimmed)) return true;
    if (/^uploads\//i.test(trimmed)) return true;
    if (/^\/media\//i.test(trimmed)) return true;
    if (/res\.cloudinary\.com/i.test(trimmed)) return true;
    return false;
};

export const resolveMediaUrl = (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    if (/^blob:/i.test(trimmed) || /^data:/i.test(trimmed)) {
        return trimmed;
    }

    if (/^\/\//.test(trimmed)) {
        return `https:${trimmed}`;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        if (/^http:\/\/res\.cloudinary\.com/i.test(trimmed)) {
            return trimmed.replace(/^http:\/\//i, 'https://');
        }
        return trimmed;
    }

    if (!BACKEND_ORIGIN) return trimmed;

    if (trimmed.startsWith('/')) {
        return `${BACKEND_ORIGIN}${trimmed}`;
    }

    if (/^(uploads|media)\//i.test(trimmed)) {
        return `${BACKEND_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
    }

    return trimmed;
};

export const normalizeMediaUrlsDeep = (input) => {
    if (Array.isArray(input)) {
        return input.map((item) => normalizeMediaUrlsDeep(item));
    }

    if (isPlainObject(input)) {
        const output = {};
        Object.keys(input).forEach((key) => {
            output[key] = normalizeMediaUrlsDeep(input[key]);
        });
        return output;
    }

    if (typeof input === 'string' && looksLikeMediaPath(input)) {
        return resolveMediaUrl(input);
    }

    return input;
};
