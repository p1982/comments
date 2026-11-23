/**
 * @jest-environment jsdom
 */
import { sanitizeHtml } from './html.schema.js';

describe('sanitizeHtml', () => {
  it('keeps allowed tags and drops every other tag and attribute', () => {
    const clean = sanitizeHtml(
      '<strong>ok</strong><script>alert(1)</script><a href="javascript:alert(1)" title="t" onclick="x">x</a><code class="c">y</code>',
    );

    expect(clean).toContain('<strong>ok</strong>');
    expect(clean).toContain('<code>y</code>');
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('javascript:');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('class=');
  });

  it('keeps an http link href and title', () => {
    const clean = sanitizeHtml('<a href="https://example.com" title="example">site</a>');

    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('title="example"');
  });

  it('strips iframe, img, and event-handler markup', () => {
    const clean = sanitizeHtml(
      '<iframe src="https://evil.example"></iframe><img src="x" onerror="alert(1)"><i onclick="alert(1)">hi</i>',
    );

    expect(clean).toBe('<i>hi</i>');
    expect(clean).not.toContain('iframe');
    expect(clean).not.toContain('img');
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('onclick');
  });
});
