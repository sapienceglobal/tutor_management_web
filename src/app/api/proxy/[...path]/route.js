/**
 * Server-side API proxy: forwards requests to the backend with x-api-key.
 * Keeps API key out of the browser (security).
 */
function normalizeBackendBase(rawBase) {
    let base = (rawBase || 'http://127.0.0.1:4000').trim();

    // Avoid Node fetch IPv6 localhost resolution issues on some Windows setups.
    base = base.replace('://localhost', '://127.0.0.1');

    // Allow env values with or without /api suffix.
    base = base.replace(/\/api\/?$/, '');

    return base.replace(/\/+$/, '');
}

const BACKEND_BASE = normalizeBackendBase(
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000'
);
const API_KEY = process.env.API_KEY || '';

export async function GET(request, context) {
    const params = await context.params;
    return proxy(request, params, 'GET');
}

export async function POST(request, context) {
    const params = await context.params;
    return proxy(request, params, 'POST');
}

export async function PUT(request, context) {
    const params = await context.params;
    return proxy(request, params, 'PUT');
}

export async function PATCH(request, context) {
    const params = await context.params;
    return proxy(request, params, 'PATCH');
}

export async function DELETE(request, context) {
    const params = await context.params;
    return proxy(request, params, 'DELETE');
}

async function proxy(request, params, method) {
    const pathSegments = params?.path || [];
    const rest = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
    const requestUrl = request.url ? new URL(request.url) : null;
    const query = requestUrl?.search?.slice(1) || '';
    const url = `${BACKEND_BASE.replace(/\/$/, '')}/api/${rest}${query ? '?' + query : ''}`;
    const auth = request.headers.get('authorization');
    const contentType = request.headers.get('content-type') || 'application/json';

    const headers = {
        'Content-Type': contentType,
        'x-api-key': API_KEY,
    };
    if (auth) headers['Authorization'] = auth;

    const opts = { method, headers };
    if (method !== 'GET' && method !== 'HEAD') {
        try {
            const body = await request.text();
            if (body) {
                opts.body = body;
            }
        } catch (_) {}
    }

    try {
        const res = await fetch(url, opts);
        
        const contentType = res.headers.get('Content-Type') || '';
        const isJson = contentType.includes('application/json');
        const isPdf = contentType.includes('application/pdf');
        if (isPdf || (!isJson && res.ok)) {
            const blob = await res.arrayBuffer();
            return new Response(blob, { status: res.status, headers: { 'Content-Type': contentType } });
        }
        const data = await res.text();
        try {
            const json = JSON.parse(data);
            return Response.json(json, { status: res.status });
        } catch {
            return new Response(data, { status: res.status, headers: { 'Content-Type': contentType || 'text/plain' } });
        }
    } catch (err) {
        console.error('Proxy error:', err);
        return Response.json({ success: false, message: 'Backend unavailable' }, { status: 502 });
    }
}
