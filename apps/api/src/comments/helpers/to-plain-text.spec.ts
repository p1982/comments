import { toPlainText } from './to-plain-text';

describe('toPlainText', () => {
  it('strips tags, decodes entities, and lowercases text', () => {
    expect(toPlainText('<strong>Hello&nbsp;&amp;&lt;World&gt;&quot;</strong>')).toBe(
      'hello &<world>"',
    );
  });

  it('collapses whitespace', () => {
    expect(toPlainText('  A   B  ')).toBe('a b');
  });
});
