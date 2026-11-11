/// <reference lib="dom" />
import { createRequire } from 'node:module';
import createDOMPurify, { type Config, type DOMPurify, type WindowLike } from 'dompurify';

import { ALLOWED_TAGS, ALLOWED_ATTRIBUTES, isHttpUrl } from './constants.js';

export const HTML_CONFIG: Config = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTRIBUTES],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
};

const allowedAttributes: readonly string[] = ALLOWED_ATTRIBUTES;

interface JsdomModule {
  JSDOM: new (html?: string) => { window: WindowLike };
}

const attachHooks = (purify: DOMPurify) => {
  purify.addHook('uponSanitizeAttribute', (node, data) => {
    const tagName = node.nodeName.toLowerCase();
    const attrName = data.attrName.toLowerCase();

    const dropAttribute = (): void => {
      // DOMPurify лишає атрибут лише коли keepAttr залишається true.
      // eslint-disable-next-line no-param-reassign
      data.keepAttr = false;
    };

    if (tagName !== 'a' || !allowedAttributes.includes(attrName)) {
      dropAttribute();
      return;
    }

    if (attrName === 'href' && !isHttpUrl(data.attrValue)) {
      dropAttribute();
    }
  });
};

// Jest 30 перехоплює require і не завантажує ESM-залежність jsdom. Браузерний шлях покритий тестом.
/* v8 ignore start */
const createNodePurify = (): DOMPurify => {
  const require = createRequire(import.meta.url);
  const { JSDOM } = require('jsdom') as JsdomModule;
  const purify = createDOMPurify(new JSDOM('').window);

  attachHooks(purify);

  return purify;
};
/* v8 ignore stop */

const createBrowserPurify = (): DOMPurify => {
  const purify = createDOMPurify(window);
  attachHooks(purify);

  return purify;
};

let purify: DOMPurify | undefined;

const getPurify = (): DOMPurify => {
  purify ??= typeof window === 'undefined' ? createNodePurify() : createBrowserPurify();
  return purify;
};

export const sanitizeHtml = (html: string): string => getPurify().sanitize(html, HTML_CONFIG);
