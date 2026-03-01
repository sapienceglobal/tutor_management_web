/**
 * XSS-safe HTML sanitization for dangerouslySetInnerHTML.
 * Uses DOMPurify (isomorphic-dompurify for SSR).
 */
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'];

export function sanitizeHtml(html) {
    if (html == null || typeof html !== 'string') return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS });
}
