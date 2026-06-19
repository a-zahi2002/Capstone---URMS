/**
 * SafeRichTextDisplay.tsx
 * ─────────────────────────────────────────────────────────────
 * XSS-safe React component for rendering user-submitted rich
 * text (HTML) in the URMS frontend.
 *
 * Problem:
 *   The URMS may display user-authored content that includes
 *   formatting (bold, italic, lists). React's default JSX
 *   rendering escapes all HTML, which strips formatting.
 *   Using `dangerouslySetInnerHTML` directly is unsafe because
 *   it would execute embedded <script> tags, onerror handlers,
 *   javascript: URIs, and other XSS vectors.
 *
 * Solution:
 *   This component sanitises the HTML through DOMPurify before
 *   passing it to `dangerouslySetInnerHTML`. DOMPurify:
 *     • Strips <script>, <iframe>, <object>, <embed> tags
 *     • Removes ALL event-handler attributes (onclick, onerror,
 *       onload, onmouseover, etc.)
 *     • Removes javascript: and data: URI schemes from hrefs
 *     • Only allows a curated allowlist of safe tags & attributes
 *
 *   `isomorphic-dompurify` is used instead of raw `dompurify`
 *   so that the import works in both server-side rendering (SSR)
 *   and client-side contexts — it uses jsdom on the server.
 *
 * Usage:
 *   <SafeRichTextDisplay
 *       unsafeHtml={ticket.description}
 *       className="prose text-sm text-slate-700"
 *   />
 * ─────────────────────────────────────────────────────────────
 */
'use client';

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

// ─── Sanitisation Configuration ────────────────────────────────
// Only allow a curated set of formatting tags. Everything else
// (including <script>, <iframe>, <style>, <form>, etc.) is
// stripped automatically.

const ALLOWED_TAGS = [
    // Text formatting
    'b', 'i', 'em', 'strong', 'u', 's', 'mark', 'small', 'sub', 'sup',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Block elements
    'p', 'br', 'hr', 'blockquote', 'pre',
    // Lists
    'ul', 'ol', 'li',
    // Links
    'a',
    // Code
    'code',
    // Tables (if needed for rich descriptions)
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = [
    'href',     // for <a> links
    'target',   // for <a target="_blank">
    'rel',      // for <a rel="noopener noreferrer">
];

// ─── Component ─────────────────────────────────────────────────

interface SafeRichTextDisplayProps {
    /** The raw, untrusted HTML string to sanitise and render. */
    unsafeHtml: string;

    /** Optional CSS class name(s) to apply to the wrapper div. */
    className?: string;

    /** Optional HTML element to use as the wrapper. Defaults to 'div'. */
    as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Renders user-submitted HTML safely by stripping all XSS
 * vectors through DOMPurify before injecting into the DOM.
 *
 * @example
 * // Basic usage
 * <SafeRichTextDisplay unsafeHtml="<b>Bold</b> and <script>alert('xss')</script>" />
 * // Renders: <div><b>Bold</b> and </div>
 *
 * @example
 * // With styling and custom wrapper element
 * <SafeRichTextDisplay
 *     unsafeHtml={ticket.description}
 *     className="prose prose-sm max-w-none"
 *     as="article"
 * />
 */
export default function SafeRichTextDisplay({
    unsafeHtml,
    className = '',
    as: WrapperTag = 'div',
}: SafeRichTextDisplayProps) {
    // ── Guard: render nothing for empty/falsy input ──────────
    if (!unsafeHtml) {
        return null;
    }

    // ── Sanitise ─────────────────────────────────────────────
    // DOMPurify parses the HTML, walks the DOM tree, and removes
    // anything not in our allowlists. The output is a clean HTML
    // string safe to inject via dangerouslySetInnerHTML.
    const cleanHtml = DOMPurify.sanitize(unsafeHtml, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        // Force all <a> tags to open in a new tab safely
        ADD_ATTR: ['target'],
    });

    // ── Post-processing: enforce rel="noopener noreferrer" ───
    // Even though we allow 'target', we want to ensure any link
    // opening in a new tab also has rel="noopener noreferrer" to
    // prevent reverse tabnapping attacks. DOMPurify's FORCE_BODY
    // doesn't do this, so we add it via a simple replace.
    const safeHtml = cleanHtml.replace(
        /<a\s/g,
        '<a rel="noopener noreferrer" '
    );

    // ── Render ───────────────────────────────────────────────
    return (
        <WrapperTag
            className={className}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    );
}
