import { z } from 'zod';

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
  text: z.string().trim().min(1, { message: 'Comment text is required' }),
});

export type CommentsSchema = z.infer<typeof commentsSchema>;
