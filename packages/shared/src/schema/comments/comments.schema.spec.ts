import { commentsSchema } from './comments.schema.js';
import { sanitizeHtml } from './html.schema.js';
import { isHttpUrl } from './constants.js';
import { isWellFormedHtml } from './xhtml.schema.js';

jest.mock('./html.schema.js', () => ({
  sanitizeHtml: jest.fn((html: string) => html),
}));

const sanitize = jest.mocked(sanitizeHtml);

const validComment = {
  fullName: 'User1',
  email: 'user@example.com',
  homepage: 'https://example.com',
  text: 'hello',
};

const parse = (overrides: Partial<typeof validComment> = {}) =>
  commentsSchema.safeParse({ ...validComment, ...overrides });

describe('commentsSchema', () => {
  describe('fullName', () => {
    it('accepts latin letters and digits', () => {
      expect(parse({ fullName: 'User1' }).success).toBe(true);
    });

    it('trims surrounding spaces before checking the name', () => {
      expect(parse({ fullName: '  User1  ' }).success).toBe(true);
    });

    it('rejects a name shorter than 2 characters', () => {
      const result = parse({ fullName: 'A' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Full name must be at least 2 characters long',
        );
      }
    });

    it('rejects a name longer than 100 characters', () => {
      const result = parse({ fullName: 'A'.repeat(101) });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Full name must be less than 100 characters long',
        );
      }
    });

    it('rejects spaces and symbols', () => {
      expect(parse({ fullName: 'User One' }).success).toBe(false);
      expect(parse({ fullName: 'User_1' }).success).toBe(false);
      expect(parse({ fullName: 'Іван' }).success).toBe(false);
    });
  });

  describe('email', () => {
    it('accepts an email address', () => {
      expect(parse({ email: 'user@example.com' }).success).toBe(true);
    });

    it('rejects an empty email', () => {
      expect(parse({ email: '' }).success).toBe(false);
    });

    it('rejects a value that is not an email', () => {
      const result = parse({ email: 'not-an-email' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid email address');
      }
    });

    it('rejects an email longer than 255 characters', () => {
      const result = parse({ email: `${'a'.repeat(250)}@example.com` });

      expect(result.success).toBe(false);
    });
  });

  describe('parentId', () => {
    it('accepts a comment without a parent', () => {
      expect(parse().success).toBe(true);
    });

    it('accepts a parent id', () => {
      expect(
        commentsSchema.safeParse({
          ...validComment,
          parentId: '22222222-2222-2222-2222-222222222222',
        }).success,
      ).toBe(true);
    });

    it('rejects a parent id that is not a string', () => {
      expect(commentsSchema.safeParse({ ...validComment, parentId: 1 }).success).toBe(false);
    });
  });

  describe('homepage', () => {
    it('accepts an http or https URL', () => {
      expect(parse({ homepage: 'https://example.com/path' }).success).toBe(true);
      expect(parse({ homepage: 'http://example.com' }).success).toBe(true);
    });

    it('accepts an empty homepage', () => {
      expect(parse({ homepage: '' }).success).toBe(true);
    });

    it('accepts a missing homepage', () => {
      const { homepage: _homepage, ...withoutHomepage } = validComment;

      expect(commentsSchema.safeParse(withoutHomepage).success).toBe(true);
    });

    it('rejects a value that is not a URL', () => {
      expect(parse({ homepage: 'example.com' }).success).toBe(false);
      expect(parse({ homepage: 'not a url' }).success).toBe(false);
    });

    it('rejects a URL longer than 500 characters', () => {
      const result = parse({ homepage: `https://example.com/${'a'.repeat(500)}` });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Homepage URL must be less than 500 characters long',
        );
      }
    });
  });

  describe('allowed tags', () => {
    it.each(['<strong>hi</strong>', '<i>hi</i>', '<code>hi</code>'])('accepts %s', (text) => {
      expect(parse({ text }).success).toBe(true);
    });

    it('accepts a link with href and title', () => {
      expect(
        parse({ text: '<a href="https://example.com" title="example">site</a>' }).success,
      ).toBe(true);
    });

    it('accepts nested allowed tags', () => {
      expect(parse({ text: '<strong><i>hi</i></strong>' }).success).toBe(true);
    });

    it('accepts plain text', () => {
      expect(parse({ text: 'hello 1 < 2' }).success).toBe(true);
    });

    it.each(['<script>alert(1)</script>', '<div>hi</div>', '<img src="x">', '<b>hi</b>'])(
      'rejects %s',
      (text) => {
        expect(parse({ text }).success).toBe(false);
      },
    );

    it('rejects an unclosed tag', () => {
      expect(parse({ text: '<strong>hi' }).success).toBe(false);
    });

    it('rejects incorrectly nested tags', () => {
      expect(parse({ text: '<i><strong>x</i></strong>' }).success).toBe(false);
    });

    it('rejects attributes on tags other than a link', () => {
      expect(parse({ text: '<code title="x">y</code>' }).success).toBe(false);
    });

    it('rejects a non-http link', () => {
      expect(parse({ text: '<a href="javascript:alert(1)">x</a>' }).success).toBe(false);
    });

    it('rejects text longer than 10000 characters', () => {
      expect(parse({ text: 'a'.repeat(10001) }).success).toBe(false);
    });

    it('rejects markup that the sanitizer rewrites', () => {
      sanitize.mockImplementationOnce((html) => `${html} `);
      const result = parse({ text: '<strong>hi</strong>' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.message)).toContain(
          'HTML contains unsupported tags or attributes',
        );
      }
    });
  });
});

describe('comment validation rules', () => {
  describe('isHttpUrl', () => {
    it('accepts http and https', () => {
      expect(isHttpUrl('http://example.com')).toBe(true);
      expect(isHttpUrl('https://example.com/path')).toBe(true);
    });

    it('rejects other protocols and values that are not URLs', () => {
      expect(isHttpUrl('ftp://example.com')).toBe(false);
      expect(isHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isHttpUrl('not a url')).toBe(false);
      expect(isHttpUrl('')).toBe(false);
    });
  });

  describe('isWellFormedHtml', () => {
    it('accepts plain text and a less-than sign that is not a tag', () => {
      expect(isWellFormedHtml('')).toBe(true);
      expect(isWellFormedHtml('hello')).toBe(true);
      expect(isWellFormedHtml('1 < 2')).toBe(true);
      expect(isWellFormedHtml('1<2')).toBe(true);
      expect(isWellFormedHtml('1<=2')).toBe(true);
      expect(isWellFormedHtml('end<')).toBe(true);
    });

    it('accepts allowed tags in either case, including a title without href', () => {
      expect(isWellFormedHtml('<CODE>x</CODE>')).toBe(true);
      expect(isWellFormedHtml('<a title="label">x</a>')).toBe(true);
      expect(isWellFormedHtml('<a href="https://example.com" title="label">x</a>')).toBe(true);
    });

    it('rejects broken, unknown, and self-closing markup', () => {
      expect(isWellFormedHtml('<strong')).toBe(false);
      expect(isWellFormedHtml('<!!!>')).toBe(false);
      expect(isWellFormedHtml('<script>x</script>')).toBe(false);
      expect(isWellFormedHtml('</strong>')).toBe(false);
      expect(isWellFormedHtml('</a href="https://example.com">')).toBe(false);
      expect(isWellFormedHtml('<strong/>')).toBe(false);
      expect(isWellFormedHtml('<a href="https://example.com"/>')).toBe(false);
    });

    it('rejects attributes that are not an http href or a title on a link', () => {
      expect(isWellFormedHtml('<code title="x">y</code>')).toBe(false);
      expect(isWellFormedHtml('<a class="x">x</a>')).toBe(false);
      expect(isWellFormedHtml('<a href="ftp://example.com">x</a>')).toBe(false);
      expect(isWellFormedHtml('<a href="notaurl">x</a>')).toBe(false);
      expect(isWellFormedHtml('<a href=https://example.com>x</a>')).toBe(false);
      expect(isWellFormedHtml('<a href="https://a.com" href="https://b.com">x</a>')).toBe(false);
      expect(isWellFormedHtml('<a href="https://example.com" onclick="x">x</a>')).toBe(false);
    });
  });
});
