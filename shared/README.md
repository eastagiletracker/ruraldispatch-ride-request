# Shared Schemas

This package contains shared Zod schemas and TypeScript types used by both frontend and backend.

## Overview

All data models are defined using **Zod v4** schemas, which provide:
- ✅ Runtime validation
- ✅ Automatic TypeScript type inference
- ✅ Single source of truth for data structures
- ✅ Consistent validation rules across frontend and backend

## Structure

```
shared/
├── package.json          # Dependencies (zod)
└── schemas/
    ├── index.ts          # Main export point
    ├── auth.ts           # Authentication schemas
    ├── user.ts           # User schemas and types
    ├── vehicle.ts        # Vehicle schemas and types
    ├── serviceProvider.ts # Service provider schemas
    └── rideRequest.ts    # Ride request schemas
```

## Usage

### Frontend (React/TypeScript)

```typescript
// Import schemas for validation
import { userFormSchema, type UserFormData } from '@shared/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Use in react-hook-form
const { register, handleSubmit } = useForm<UserFormData>({
  resolver: zodResolver(userFormSchema)
});

// Or validate manually
const result = userFormSchema.safeParse(data);
if (result.success) {
  const validData: UserFormData = result.data;
}
```

### Backend (Node.js/Express)

```javascript
// Import schemas (when backend is updated)
const { userFormSchema } = require('../shared/schemas');

// Validate request body
app.post('/api/users', (req, res) => {
  const result = userFormSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors
    });
  }
  
  const validatedUser = result.data;
  // ... save to database
});
```

## Available Schemas

### Authentication
- `signInSchema` - Login form validation
- Types: `SignInFormData`

### User
- `userSchema` - Complete user model (with uuid)
- `userFormSchema` - User creation/edit form
- Types: `User`, `UserFormData`, `ServiceUserRole`, etc.

### Vehicle
- `vehicleSchema` - Complete vehicle model
- `vehicleFormSchema` - Vehicle creation/edit form
- Types: `Vehicle`, `VehicleFormData`, `AccessibilityNeed`

### Service Provider
- `serviceProviderSchema` - Complete provider model
- `serviceProviderFormSchema` - Provider creation/edit form
- Types: `ServiceProvider`, `ServiceProviderFormData`, `Organization`, etc.

### Ride Request
- `rideRequestSchema` - Complete ride request model
- `rideRequestFormSchema` - Ride request form (includes case manager info, rider info, accessibility features)
- Types: `RideRequest`, `RideRequestFormData`

## Schema Patterns

### Database Model vs Form Schema

```typescript
// Complete model (includes uuid, timestamps)
export const userSchema = z.object({
  uuid: z.string(),
  fullName: z.string().min(1),
  // ... all fields
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional()
});

// Form schema (excludes uuid, focuses on validation)
export const userFormSchema = userSchema.omit({ 
  uuid: true,
  createdAt: true,
  updatedAt: true
});

// Inferred types
export type User = z.infer<typeof userSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
```

### Enums and Options

```typescript
// Define options as const arrays
export const ServiceUserRoles = [
  "rider",
  "caregiver",
  "relative",
  // ...
] as const;

// Use in schema
serviceUserRole: z.array(z.enum(ServiceUserRoles))
  .min(1, 'At least one role required')

// Export type
export type ServiceUserRole = typeof ServiceUserRoles[number];
```

## Type Safety

All types are **automatically inferred** from Zod schemas:

```typescript
// ❌ Don't do this (manual type definition)
interface User {
  name: string;
  email: string;
}

// ✅ Do this (inferred from schema)
const userSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

export type User = z.infer<typeof userSchema>;
// Type and validation always stay in sync!
```

## Migration Guide

### For Existing Code

The frontend has been updated to use shared schemas:

1. **Type imports** - Work exactly as before:
   ```typescript
   import type { User, Vehicle } from '@/types';
   // These now come from shared schemas automatically
   ```

2. **Validation** - Use schemas from `@/schemas/validation`:
   ```typescript
   import { userSchema } from '@/schemas/validation';
   // This re-exports from shared schemas
   ```

3. **Direct import** - Can also import directly:
   ```typescript
   import { userFormSchema, type User } from '@shared/schemas';
   ```

### For Backend (Future)

When updating the backend:

1. Add TypeScript support (or use safeParse in JavaScript)
2. Import schemas from `../shared/schemas`
3. Validate all incoming request data
4. Validate data before saving to database
5. Remove duplicate validation logic

## Benefits

### Before (Separate Types + Manual Validation)
```typescript
// types/user.ts
interface User {
  name: string;
  email: string;
}

// validators/user.js
function validateUser(data) {
  if (!data.name) return { error: 'Name required' };
  if (!data.email) return { error: 'Email required' };
  if (!isValidEmail(data.email)) return { error: 'Invalid email' };
  return { valid: true };
}
```

Problems:
- ❌ Types and validation can get out of sync
- ❌ Duplicate validation logic (frontend + backend)
- ❌ No runtime type safety
- ❌ Easy to forget validation rules

### After (Shared Zod Schemas)
```typescript
// shared/schemas/user.ts
export const userSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email')
});

export type User = z.infer<typeof userSchema>;
```

Benefits:
- ✅ Single source of truth
- ✅ Types automatically match validation
- ✅ Same validation frontend + backend
- ✅ Runtime type safety
- ✅ Better error messages

## Testing

```typescript
import { userFormSchema } from '@shared/schemas';

describe('userFormSchema', () => {
  it('validates correct data', () => {
    const validData = {
      fullName: 'John Doe',
      phone: '123-456-7890',
      // ... other fields
    };
    
    const result = userFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
  
  it('rejects invalid phone', () => {
    const invalidData = {
      fullName: 'John Doe',
      phone: 'invalid',
      // ...
    };
    
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toEqual(['phone']);
  });
});
```

## Extending Schemas

```typescript
// Create a partial schema for updates
const updateUserSchema = userFormSchema.partial();

// Create a schema with additional fields
const userWithMetaSchema = userSchema.extend({
  lastLoginAt: z.date().optional(),
  loginCount: z.number().default(0)
});

// Pick specific fields
const userLoginSchema = userSchema.pick({
  email: true,
  password: true
});

// Omit fields
const publicUserSchema = userSchema.omit({
  password: true,
  secretField: true
});
```

## Documentation

For more information on Zod:
- [Zod Documentation](https://zod.dev/)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)

## Changelog

### v1.0.0 - Initial Release
- Created shared schemas package
- Migrated all validation from separate TypeScript types
- Added comprehensive schemas for User, Vehicle, ServiceProvider, RideRequest
- Configured path aliases in frontend
- Backward compatible with existing `@/types` imports
