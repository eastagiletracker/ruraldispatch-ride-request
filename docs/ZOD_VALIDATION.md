# Zod Validation Implementation Guide

## Overview
This document describes the implementation of Zod v4 validation across all forms in the application using `react-hook-form` and `@hookform/resolvers`.

## Packages Installed
```bash
npm install react-hook-form @hookform/resolvers
```

## Validation Schemas
All validation schemas are centralized in `/client/src/schemas/validation.ts` using Zod v4:

```typescript
import { z } from 'zod/v4';
```

Available schemas:
- `signInSchema` - Sign in form
- `vehicleSchema` - Vehicle creation form
- `serviceProviderSchema` - Service provider creation form  
- `userSchema` - User creation form
- `rideRequestSchema` - Internal ride request form
- `publicRideRequestSchema` - Public ride request form

## Implementation Pattern

### Basic Form Pattern (SignIn.tsx - ✅ COMPLETED)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInFormData } from "@/schemas/validation";

export default function SignIn() {
    const [serverError, setServerError] = useState('');
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema)
    });

    const onSubmit = async (formData: SignInFormData) => {
        setServerError('');
        // Handle form submission
        try {
            // API call
        } catch (error) {
            setServerError('Error message');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Input {...register('username')} />
            {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
            
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
        </form>
    );
}
```

### Form with Select Components (CreateVehicle.tsx - ✅ COMPLETED)

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleSchema, type VehicleFormData } from "@/schemas/validation";

export default function CreateVehicle() {
    const [currentUuid, setCurrentUuid] = useState(generateUUID());
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<VehicleFormData>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            displayName: '',
            fleetId: '',
            capacity: '',
            serviceArea: '',
            accessibilityFeatures: ''
        }
    });

    const onSubmit = async (data: VehicleFormData) => {
        const vehicleData = {
            uuid: currentUuid,
            ...data
        };
        // Handle submission
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Regular Input */}
            <Input {...register('displayName')} />
            {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}

            {/* Number Input */}
            <Input type="number" {...register('capacity')} />
            {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
            )}
        </form>
    );
}
```

### Form with Controller for Select (CreateProvider.tsx - ✅ COMPLETED)

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceProviderSchema, type ServiceProviderFormData } from "@/schemas/validation";

export default function CreateProvider() {
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors, isSubmitting },
        reset
    } = useForm<ServiceProviderFormData>({
        resolver: zodResolver(serviceProviderSchema)
    });

    const serviceProviderRole = watch('serviceProviderRole');

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Regular Input */}
            <Input {...register('fullName')} />
            {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}

            {/* Select with Controller */}
            <Controller
                name="organization"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                            {ORGANIZATIONS.map(org => (
                                <SelectItem key={org} value={org}>{org}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.organization && (
                <p className="text-sm text-destructive">{errors.organization.message}</p>
            )}

            {/* Conditional Field based on watch */}
            {serviceProviderRole === 'Staff' && (
                <Controller
                    name="specializations"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            {/* ... */}
                        </Select>
                    )}
                />
            )}
        </form>
    );
}
```

## Remaining Forms to Update

### 1. UserForm.tsx (⏳ TODO)
- Schema: `userSchema`
- Type: `UserFormData`
- Complex nested objects: `residence`, `income`
- Array field: `serviceUserRole[]`
- Pattern:
  ```typescript
  // Nested objects
  <Input {...register('residence.current')} />
  <Input {...register('residence.last')} />
  
  // Checkbox arrays
  <Controller
    name="serviceUserRole"
    control={control}
    render={({ field }) => (
      <Checkbox
        checked={field.value?.includes(role)}
        onCheckedChange={(checked) => {
          if (checked) {
            field.onChange([...field.value, role]);
          } else {
            field.onChange(field.value?.filter(v => v !== role));
          }
        }}
      />
    )}
  />
  ```

### 2. RideRequestForm.tsx (⏳ TODO)
- Schema: `rideRequestSchema`
- Type: `RideRequestFormData`
- Features: Date/time fields, conditional fields
- Pattern:
  ```typescript
  <Input type="date" {...register('pickupRequestedDate')} />
  <Input type="time" {...register('pickupRequestedTime')} />
  
  <Controller
    name="roundtrip"
    control={control}
    render={({ field }) => (
      <Checkbox
        checked={field.value}
        onCheckedChange={field.onChange}
      />
    )}
  />
  ```

### 3. PublicRideRequestForm.tsx (⏳ TODO)
- Schema: `publicRideRequestSchema`
- Type: `PublicRideRequestFormData`
- Features: Multiple checkbox fields for accessibility
- Pattern:
  ```typescript
  <Controller
    name="walkerAccessible"
    control={control}
    render={({ field }) => (
      <Checkbox
        checked={field.value}
        onCheckedChange={field.onChange}
      />
    )}
  />
  
  <Textarea {...register('notesComments')} />
  ```

## Key Differences from Previous Implementation

### Before (Manual Validation)
```typescript
const [formData, setFormData] = useState({...});
const [errors, setErrors] = useState({});

const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [name]: value }));
};

const validateForm = () => {
    const newErrors = {};
    if (!formData.field) newErrors.field = 'Required';
    // ... more validation
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // submit
};
```

### After (Zod with react-hook-form)
```typescript
const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
} = useForm({
    resolver: zodResolver(schema)
});

const onSubmit = async (data) => {
    // data is already validated!
    // submit
};

// In JSX
<form onSubmit={handleSubmit(onSubmit)}>
    <Input {...register('field')} />
    {errors.field && <p>{errors.field.message}</p>}
</form>
```

## Benefits

1. **Type Safety**: Full TypeScript support with inferred types
2. **Centralized Validation**: All rules in one place
3. **Consistent Error Messages**: Defined in schema
4. **Less Boilerplate**: No manual state management for form data
5. **Better UX**: Real-time validation, field-level errors
6. **Reusable**: Schemas can be used client and server-side

## Common Patterns

### Error Display
```typescript
{errors.fieldName && (
    <p className="text-sm text-destructive">
        {errors.fieldName.message}
    </p>
)}
```

### Loading States
```typescript
<Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>
```

### Reset Form
```typescript
reset(); // Reset to default values
reset({ field: 'value' }); // Reset with specific values
```

### Form with UUID
```typescript
const [currentUuid, setCurrentUuid] = useState(generateUUID());

const onSubmit = async (data) => {
    const submitData = { uuid: currentUuid, ...data };
    // ...
    setCurrentUuid(generateUUID()); // New UUID after success
    reset();
};
```

## Next Steps

1. ✅ SignIn.tsx - COMPLETED
2. ✅ CreateVehicle.tsx - COMPLETED  
3. ✅ CreateProvider.tsx - COMPLETED (needs form section fixes)
4. ⏳ Update UserForm.tsx
5. ⏳ Update RideRequestForm.tsx
6. ⏳ Update PublicRideRequestForm.tsx

## Testing Checklist

For each form:
- [ ] All required fields show validation errors when empty
- [ ] Custom validation rules work (phone numbers, dates, etc.)
- [ ] Form submits with valid data
- [ ] Form resets after successful submission
- [ ] Loading states display correctly
- [ ] Server errors display properly
- [ ] TypeScript compilation passes
