/**
 * Ride Request Schema - Shared between Frontend and Backend
 * Using Zod v4 for runtime validation and type inference
 */

import { z } from 'zod/v4';
import { isValidPhoneNumber } from 'react-phone-number-input';

/**
 * Address Type for Google Places Autocomplete
 * Used in frontend forms with address autocomplete
 */
export const AddressTypeSchema = z.object({
  address1: z.string(),
  address2: z.string().optional(),
  formattedAddress: z.string(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export type AddressTypeForForm = z.infer<typeof AddressTypeSchema>;

/**
 * Ride Request Type Options
 */
export const RideRequestTypes = [
  "Standard",
  "Emergency",
  "Medical",
  "Shopping"
] as const;

/**
 * Complete Ride Request Schema (database model)
 */
export const rideRequestSchema = z.object({
  uuid: z.union([z.number(), z.string()]),
  displayId: z.string().optional(), // Human-readable ID (e.g., RIDE-X7K9)
  serviceUserUuid: z.string(),
  serviceUserRole: z.string(),
  pickupAddress: z.string()
    .min(1, 'Pickup address is required')
    .trim(),
  dropOffAddress: z.string()
    .min(1, 'Drop-off address is required')
    .trim(),
  roundTrip: z.boolean(),
  pickupRequestedTime: z.string()
    .min(1, 'Pickup time is required'),
  dropOffRequestedTime: z.string()
    .min(1, 'Drop-off time is required'),
  rideStartedActualTime: z.union([z.date(), z.string()]),
  pickupActualTime: z.union([z.date(), z.string()]),
  dropOffActualTime: z.union([z.date(), z.string()]),
  rideCompleteRequestedTime: z.union([z.date(), z.string()]),
  rideCompleteActualTime: z.union([z.date(), z.string()]),
  rideStatus: z.number(),
  purpose: z.string(),
  rideRequestStatus: z.number(),
  notes: z.string(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional()
});

/**
 * Comprehensive Ride Request Form Schema
 * Merged from internal and public forms - used for all ride request creation
 */
export const rideRequestFormSchema = z.object({
  // Case Manager Info
  caseManagerFullName: z.string()
    .min(1, "Case Manager's full name is required")
    .trim(),
  caseManagerAgency: z.string()
    .min(1, "Case Manager's agency is required")
    .trim(),
  caseManagerPhone: z.string()
    .min(1, "Case Manager's phone number is required")
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),

  // Rider Info
  riderFullName: z.string()
    .min(1, "Rider's full name is required")
    .trim(),
  riderMobilePhone: z.string()
    .min(1, "Rider's mobile phone number is required")
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),

  // Ride Details - Accepts either string or AddressType (from autocomplete)
  pickupLocation: z.union([
    z.string().min(1, 'Pickup location is required').trim(),
    AddressTypeSchema
  ]).refine(
    (val) => {
      if (typeof val === 'string') return val.trim().length > 0;
      return val.formattedAddress && val.formattedAddress.length > 0;
    },
    { message: 'Pickup location is required' }
  ),
  dropoffLocation: z.union([
    z.string().min(1, 'Drop-off location is required').trim(),
    AddressTypeSchema
  ]).refine(
    (val) => {
      if (typeof val === 'string') return val.trim().length > 0;
      return val.formattedAddress && val.formattedAddress.length > 0;
    },
    { message: 'Drop-off location is required' }
  ),
  roundtrip: z.boolean().optional(),
  pickupRequestedDate: z.string()
    .min(1, 'Pickup date is required'),
  pickupRequestedTime: z.string()
    .min(1, 'Pickup time is required'),
  estimatedWaitTime: z.string().optional(),

  // Accessibility Features (Checkboxes)
  walkerAccessible: z.boolean().optional(),
  wheelchairAccessible: z.boolean().optional(),
  serviceAnimalFriendly: z.boolean().optional(),
  oxygenTankAccessible: z.boolean().optional(),

  // Purpose and Notes
  purposeOfTrip: z.string()
    .min(1, 'Purpose of trip is required')
    .trim(),
  notesComments: z.string().optional()
});

/**
 * Inferred TypeScript Types
 */
export type RideRequest = z.infer<typeof rideRequestSchema>;
export type RideRequestFormData = z.infer<typeof rideRequestFormSchema>;
export type RideRequestType = typeof RideRequestTypes[number];
