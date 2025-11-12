/**
 * Address validation schema using Zod v4
 * Adapted from: https://github.com/NiazMorshed2007/shadcn-address-autocomplete
 */

import { z } from "zod";

/**
 * Complete address schema with all required fields
 * Note: address1 and postalCode are optional to allow city-level selections
 * Note: lat/lng can be negative (South/West hemispheres)
 */
export const AddressSchema = z.object({
  address1: z.string().optional(),
  address2: z.string().optional(),
  formattedAddress: z.string().min(1, "Please select a complete address"),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "State/Region is required"),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  lat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  lng: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
});

export type AddressType = z.infer<typeof AddressSchema>;

/**
 * Validates if an address object is complete and valid
 * @param address - The address object to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: Partial<AddressType>): address is AddressType {
  const result = AddressSchema.safeParse(address);
  return result.success;
}

/**
 * Partial address schema for incomplete addresses (during editing)
 */
export const PartialAddressSchema = z.object({
  address1: z.string().optional(),
  address2: z.string().optional(),
  formattedAddress: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  lat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  lng: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
});

export type PartialAddressType = z.infer<typeof PartialAddressSchema>;

/**
 * Creates a dynamic schema based on which fields are present
 * This allows for flexible validation during editing
 */
export function createDynamicAddressSchema(address: PartialAddressType) {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  if (address.address1 !== undefined) {
    schemaFields.address1 = z.string().min(1, "Address line 1 is required");
  }

  if (address.address2 !== undefined) {
    schemaFields.address2 = z.string();
  }

  if (address.formattedAddress !== undefined) {
    schemaFields.formattedAddress = z.string().min(1, "Formatted address is required");
  }

  if (address.city !== undefined) {
    schemaFields.city = z.string().min(1, "City is required");
  }

  if (address.region !== undefined) {
    schemaFields.region = z.string().min(1, "State/Region is required");
  }

  if (address.postalCode !== undefined) {
    schemaFields.postalCode = z.string().min(1, "Postal code is required");
  }

  if (address.country !== undefined) {
    schemaFields.country = z.string().min(1, "Country is required");
  }

  if (address.lat !== undefined) {
    schemaFields.lat = z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude");
  }

  if (address.lng !== undefined) {
    schemaFields.lng = z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude");
  }

  return z.object(schemaFields);
}
