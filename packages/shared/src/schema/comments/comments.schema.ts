import { z } from 'zod';

import { sanitizeHtml } from './html.schema.js';

export const commentsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters long' })
    .max(100, { message: 'Full name must be less than 100 characters long' })
    .regex(/^[A-Za-z0-9]+$/, { message: 'Full name must contain only letters and numbers' }),
  email: z
    .email({ message: 'Invalid email address' })
    .min(1, { message: 'Email is required' })
    .max(255, { message: 'Email must be less than 255 characters long' }),
  homepage: z
    .union([
      z.literal(''),
      z.url().max(500, { message: 'Homepage URL must be less than 500 characters long' }),
    ])
    .optional(),
  text: z
    .string()
    .trim()
    .max(10000, 'Content is too long')
    .superRefine((html, ctx) => {
      const sanitized = sanitizeHtml(html);

      if (sanitized !== html) {
        ctx.addIssue({
          code: 'custom',
          message: 'HTML contains unsupported tags or attributes',
        });
      }
    }),
});

export type CommentsSchema = z.infer<typeof commentsSchema>;
