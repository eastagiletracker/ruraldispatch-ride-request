/**
 * Service Provider Schema - Shared between Frontend and Backend
 * Using Zod v4 for runtime validation and type inference
 */

import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod/v4';

/**
 * Enums for Service Provider Options
 */
export const Organizations = ['EASTCONN', 'Generations Health'] as const;

export const ServiceProviderRoles = [
  'Transport Broker',
  'Staff',
  'Fleet Manager',
  'Driver',
  'Admin',
] as const;

export const Specializations = ['Caseworker', 'Nutritionist', 'Intake'] as const;

/**
 * Complete Service Provider Schema (database model)
 */
export const serviceProviderSchema = z.object({
  uuid: z.string(),
  fullName: z.string().min(1, 'Full name is required').trim(),
  title: z.string().min(1, 'Title is required').trim(),
  organization: z.string().min(1, 'Organization is required'),
  mobilePhone: z
    .string()
    .min(1, 'Mobile phone is required')
    .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number')
    .trim(),
  serviceProviderRole: z.string().min(1, 'Service provider role is required'),
  specializations: z.string().optional(),
  faxPhone: z.string().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Service Provider Form Schema (for creating/editing)
 */
export const serviceProviderFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
  title: z.string().min(1, 'Title is required').trim(),
  organization: z.string().min(1, 'Organization is required'),
  mobilePhone: z
    .string()
    .min(1, 'Mobile phone is required')
    .refine(isValidPhoneNumber, { message: 'Invalid phone number' }),
  serviceProviderRole: z.string().min(1, 'Service provider role is required'),
  specializations: z.string().optional(),
  faxPhone: z
    .string()
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: 'Invalid fax phone number',
    })
    .optional(),
});

/**
 * Inferred TypeScript Types
 */
export type ServiceProvider = z.infer<typeof serviceProviderSchema>;
export type ServiceProviderFormData = z.infer<typeof serviceProviderFormSchema>;
export type Organization = (typeof Organizations)[number];
export type ServiceProviderRole = (typeof ServiceProviderRoles)[number];
export type Specialization = (typeof Specializations)[number];
