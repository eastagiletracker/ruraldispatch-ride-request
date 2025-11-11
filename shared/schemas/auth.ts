/**
 * Authentication Schema - Shared between Frontend and Backend
 * Using Zod v4 for runtime validation and type inference
 */

import { z } from 'zod/v4';

/**
 * Sign In Schema
 */
export const signInSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
});

/**
 * Inferred TypeScript Types
 */
export type SignInFormData = z.infer<typeof signInSchema>;
