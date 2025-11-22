/**
 * User Schema - Shared between Frontend and Backend
 * Using Zod v4 for runtime validation and type inference
 */

import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod/v4';
import { AddressTypeSchema } from './rideRequest';

/**
 * Enums for User Select Options
 */
export const RaceOptions = [
  'black',
  'white',
  'asian',
  'latino',
  'native american',
  'other',
  'prefer not to say',
] as const;

export const MaritalStatusOptions = [
  'single',
  'married',
  'divorced',
  'widowed',
  'separated',
  'other',
  'prefer not to say',
] as const;

export const VeteranStatusOptions = ['veteran', 'not veteran', 'prefer not to say'] as const;

export const DisabilityStatusOptions = ['yes', 'no', 'prefer not to say'] as const;

export const ServiceUserRoles = [
  'rider',
  'caregiver',
  'relative',
  'guardian',
  'case manager',
  'other',
] as const;

/**
 * Complete User Schema (database model)
 */
export const userSchema = z.object({
  uuid: z.string(),
  fullName: z.string().min(1, 'Full name is required').trim(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number')
    .trim(),
  dob: z.string().min(1, 'Date of birth is required'),
  race: z.enum([...RaceOptions] as [string, ...string[]]).or(z.string()),
  maritalStatus: z.enum([...MaritalStatusOptions] as [string, ...string[]]).or(z.string()),
  residence: z.object({
    current: z.string(),
    last: z.string(),
  }),
  income: z.object({
    current: z.string(),
    last: z.string(),
  }),
  serviceUserRole: z
    .array(z.enum([...ServiceUserRoles] as [string, ...string[]]))
    .min(1, 'At least one service user role is required'),
  veteranStatus: z
    .enum([...VeteranStatusOptions] as [string, ...string[]])
    .or(z.string())
    .optional(),
  disabilityStatus: z
    .enum([...DisabilityStatusOptions] as [string, ...string[]])
    .or(z.string())
    .optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * User Form Schema (for creating/editing users)
 */
export const userFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(isValidPhoneNumber, { message: 'Invalid phone number' }),
  dob: z.string().min(1, 'Date of birth is required'),
  race: z.string().min(1, 'Race is required'),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  residence: z.object({
    current: z.union([z.string(), AddressTypeSchema, z.null()]).optional(),
    last: z.union([z.string().min(1, 'Last residence is required'), AddressTypeSchema]).refine(
      (val) => {
        if (typeof val === 'string') return val.trim().length > 0;
        return val.formattedAddress && val.formattedAddress.length > 0;
      },
      { message: 'Last residence is required' }
    ),
  }),
  income: z.object({
    current: z.string().optional(),
    last: z.string().min(1, 'Last income is required'),
  }),
  serviceUserRole: z.array(z.string()).min(1, 'At least one service user role is required'),
  veteranStatus: z.string().optional(),
  disabilityStatus: z.string().optional(),
});

/**
 * Inferred TypeScript Types
 */
export type User = z.infer<typeof userSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
export type RaceOption = (typeof RaceOptions)[number];
export type MaritalStatusOption = (typeof MaritalStatusOptions)[number];
export type VeteranStatusOption = (typeof VeteranStatusOptions)[number];
export type DisabilityStatusOption = (typeof DisabilityStatusOptions)[number];
export type ServiceUserRole = (typeof ServiceUserRoles)[number];
