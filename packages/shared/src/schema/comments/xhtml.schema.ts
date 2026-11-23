import { ALLOWED_TAGS, ALLOWED_ATTRIBUTES, isHttpUrl } from './constants.js';

const TAG_PATTERN = /^<\/?([a-z]+)([^<>]*)>/i;

const isAllowedTag = (name: string): name is (typeof ALLOWED_TAGS)[number] =>
  (ALLOWED_TAGS as readonly string[]).includes(name);
const attributesAllowed = (tag: string, raw: string): boolean => {
  const attrs = raw.trim();
  if (tag !== 'a') return attrs.length === 0;
  const seen = new Set<string>();
  const pattern = /([a-z]+)\s*=\s*"([^"]*)"/gi;
  let rest = attrs;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(attrs)) !== null) {
    const name = String(match[1]).toLowerCase();
    const value = String(match[2]);
    if (seen.has(name) || !(ALLOWED_ATTRIBUTES as readonly string[]).includes(name)) return false;
    if (name === 'href' && !isHttpUrl(value)) return false;
    seen.add(name);
    rest = rest.replace(match[0], '');
  }
  return rest.trim().length === 0;
};
export const isWellFormedHtml = (html: string): boolean => {
  const stack: string[] = [];
  let index = 0;
  while (index < html.length) {
    if (html[index] !== '<') {
      index += 1;
      continue;
    }
    const next = html[index + 1];
    if (next === undefined || /[\s\d=]/.test(next)) {
      index += 1;
      continue;
    }
    const tag = TAG_PATTERN.exec(html.slice(index));
    if (tag === null) return false;
    const raw = tag[0];
    const name = String(tag[1]).toLowerCase();
    const attrs = String(tag[2]);
    if (!isAllowedTag(name)) return false;
    if (raw.startsWith('</')) {
      if (attrs.trim() !== '' || stack.pop() !== name) return false;
    } else {
      if (raw.endsWith('/>') || !attributesAllowed(name, attrs)) return false;
      stack.push(name);
    }
    index += raw.length;
  }
  return stack.length === 0;
};
