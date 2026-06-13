/**
 * Strip HTML tags to plain visible text.
 *
 * Use ONLY for length validation / previews — NOT for sanitizing untrusted
 * HTML before rendering (use a real sanitizer like DOMPurify for that).
 *
 * The `\s` class matches the non-breaking space Tiptap emits, so collapsing
 * whitespace is enough to normalize the extracted text.
 */
export function htmlToText(html: string): string {
  if (!html) return '';
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tags the rich-text editor / sanitizer can produce. Presence of any means the
// value is already HTML rather than legacy plain text.
const HTML_TAG_RE = /<\/?(?:p|h[1-6]|ul|ol|li|strong|em|b|i|a|br|blockquote)\b/i;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Prepare a stored description for the rich-text editor.
 *
 * Values authored in the editor are already HTML and pass through unchanged.
 * Legacy plain-text descriptions are split on newlines into separate
 * paragraphs — otherwise the whole description loads as a single block and
 * block formatting (headings, lists) would target the entire description
 * instead of one line.
 */
export function descriptionToEditorHtml(value: string | undefined | null): string {
  if (!value) return '';
  if (HTML_TAG_RE.test(value)) return value;
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}
