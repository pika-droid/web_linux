import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../lib/sanitize';

describe('sanitizeHtml', () => {
  it('keeps safe formatting elements and attributes', () => {
    const input = '<div class="note-content"><p>Hello <b>world</b>, <i>italic</i>, and <u>underline</u>.</p><ul><li>Item</li></ul></div>';
    const output = sanitizeHtml(input);
    expect(output).toContain('class="note-content"');
    expect(output).toContain('<b>world</b>');
    expect(output).toContain('<i>italic</i>');
    expect(output).toContain('<u>underline</u>');
    expect(output).toContain('<ul><li>Item</li></ul>');
  });

  it('completely strips script tags and their contents', () => {
    const input = '<p>Safe content</p><script>alert("XSS")</script><p>More safe content</p>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).not.toContain('alert("XSS")');
    expect(output).toBe('<p>Safe content</p><p>More safe content</p>');
  });

  it('completely strips iframe, object, embed, and style tags', () => {
    const input = '<div><iframe src="malicious.html"></iframe><object data="bad"></object><embed src="bad"><style>body { color: red; }</style>Safe</div>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<div>Safe</div>');
  });

  it('strips unsafe attributes like on* event handlers', () => {
    const input = '<div class="alert" onclick="alert(1)" onmouseover="run()">Click here</div>';
    const output = sanitizeHtml(input);
    expect(output).toContain('class="alert"');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('onmouseover');
  });

  it('keeps safe style attributes but strips active content style injections', () => {
    const safeInput = '<span style="color: red; font-size: 12px;">Styled Text</span>';
    expect(sanitizeHtml(safeInput)).toBe('<span style="color: red; font-size: 12px;">Styled Text</span>');

    const unsafeInput1 = '<span style="color: red; background: url(javascript:alert(1))">Unsafe 1</span>';
    expect(sanitizeHtml(unsafeInput1)).toBe('<span>Unsafe 1</span>');

    const unsafeInput2 = '<span style="width: expression(alert(1))">Unsafe 2</span>';
    expect(sanitizeHtml(unsafeInput2)).toBe('<span>Unsafe 2</span>');
  });

  it('handles empty input gracefully', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
  });
});
