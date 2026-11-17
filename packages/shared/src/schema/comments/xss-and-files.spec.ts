/**
 * @jest-environment jsdom
 */
import { commentsSchema } from './comments.schema.js';

const validComment = {
  fullName: 'User1',
  email: 'user@example.com',
  homepage: 'https://example.com',
  text: 'hello',
  captcha: 'AB12C',
};

const parse = (text: string) => commentsSchema.safeParse({ ...validComment, text });

describe('xss and files: excess HTML is rejected', () => {
  it.each([
    '<script>alert(1)</script>',
    '<strong>ok</strong><script>alert(1)</script>',
    '<div>hi</div>',
    '<img src="x" onerror="alert(1)">',
    '<iframe src="https://evil.example"></iframe>',
    '<a href="javascript:alert(1)">x</a>',
    '<i onclick="alert(1)">hi</i>',
    '<strong title="x">hi</strong>',
  ])('rejects %s', (text) => {
    const result = parse(text);

    expect(result.success).toBe(false);
  });

  it('accepts only the allowed tags', () => {
    expect(parse('<strong><i>hi</i></strong>').success).toBe(true);
    expect(parse('<code>hi</code>').success).toBe(true);
    expect(parse('<a href="https://example.com" title="site">link</a>').success).toBe(true);
  });
});
