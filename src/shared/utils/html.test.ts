import { describe, expect, it } from 'vitest';
import { descriptionToEditorHtml, htmlToText } from './html';

describe('htmlToText', () => {
  it('returns empty string for an empty editor document', () => {
    expect(htmlToText('<p></p>')).toBe('');
  });

  it('returns empty string for empty / whitespace-only input', () => {
    expect(htmlToText('')).toBe('');
    expect(htmlToText('<p>   </p>')).toBe('');
  });

  it('strips inline tags but keeps the text', () => {
    expect(htmlToText('<p>hello <strong>world</strong></p>')).toBe('hello world');
  });

  it('decodes HTML entities', () => {
    expect(htmlToText('<p>a &amp; b</p>')).toBe('a & b');
  });

  it('extracts text from lists and headings', () => {
    expect(htmlToText('<h2>Title</h2><ul><li>one</li><li>two</li></ul>')).toContain('Title');
    expect(htmlToText('<h2>Title</h2><ul><li>one</li><li>two</li></ul>').length).toBeGreaterThan(
      10
    );
  });
});

describe('descriptionToEditorHtml', () => {
  it('splits legacy multi-line plain text into separate paragraphs', () => {
    expect(descriptionToEditorHtml('line one\nline two\nline three')).toBe(
      '<p>line one</p><p>line two</p><p>line three</p>'
    );
  });

  it('drops blank lines and trims', () => {
    expect(descriptionToEditorHtml('  a  \n\n  b  ')).toBe('<p>a</p><p>b</p>');
  });

  it('wraps a single plain-text line in one paragraph', () => {
    expect(descriptionToEditorHtml('just one line')).toBe('<p>just one line</p>');
  });

  it('passes already-HTML values through unchanged', () => {
    const html = '<h2>Title</h2><p>body</p><ul><li>x</li></ul>';
    expect(descriptionToEditorHtml(html)).toBe(html);
  });

  it('escapes HTML special chars in legacy plain text', () => {
    expect(descriptionToEditorHtml('a < b & c')).toBe('<p>a &lt; b &amp; c</p>');
  });

  it('returns empty string for empty / null input', () => {
    expect(descriptionToEditorHtml('')).toBe('');
    expect(descriptionToEditorHtml(null)).toBe('');
    expect(descriptionToEditorHtml(undefined)).toBe('');
  });
});
