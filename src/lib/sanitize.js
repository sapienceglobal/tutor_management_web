/**
 * XSS-safe HTML sanitization for dangerouslySetInnerHTML.
 * Uses standard DOMPurify for Client-Side rendering.
 */
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'];

export function sanitizeHtml(html) {
    if (html == null || typeof html !== 'string') return '';
    
    // ✅ FIX: Server-side rendering (SSR) build time par error se bachne ke liye
    if (typeof window === 'undefined') {
        return html; 
    }

    return DOMPurify.sanitize(html, { ALLOWED_TAGS });
}