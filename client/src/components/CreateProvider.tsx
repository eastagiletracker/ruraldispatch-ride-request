import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type ServiceProviderFormData, serviceProviderFormSchema } from '@/schemas/validation';
import type { Organization, ServiceProviderRole, Specialization } from '@/types';
import { createDocument } from '../utils/database';

const ORGANIZATIONS: Organization[] = ['EASTCONN', 'Generations Health'];

const SERVICE_PROVIDER_ROLES: ServiceProviderRole[] = [
  'Transport Broker',
  'Staff',
  'Fleet Manager',
  'Driver',
  'Admin',
];

const SPECIALIZATIONS: Specialization[] = ['Caseworker', 'Nutritionist', 'Intake'];

export default function CreateProvider() {
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ServiceProviderFormData>({
    resolver: zodResolver(serviceProviderFormSchema),
    defaultValues: {
      fullName: '',
      title: '',
      organization: '',
      mobilePhone: '',
      serviceProviderRole: '',
      specializations: '',
      faxPhone: '',
    },
  });

  const serviceProviderRole = watch('serviceProviderRole');

  const onSubmit = async (data: ServiceProviderFormData) => {
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Backend will generate UUID
      const response = await createDocument('providers', data);

      if (response.ok) {
        setSubmitSuccess(true);
        toast.success('Service provider created successfully!', {
          description: `${data.fullName} has been added to the system.`,
        });

        // Reset form
        reset();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Please try again.';
        setSubmitError(errorMessage);
        toast.error('Failed to create service provider', {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = 'Please try again or contact support.';
      setSubmitError(errorMessage);
      toast.error('Error submitting form', {
        description: errorMessage,
      });
    }
  };

  const handleReset = () => {
    reset();
    setSubmitSuccess(false);
    setSubmitError('');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Service Provider</CardTitle>
        <CardDescription>Fill in the information to create a new service provider</CardDescription>
      </CardHeader>

      <CardContent>
        {submitSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>Service provider created successfully!</AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="provider-form">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Enter full name"
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter title"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization">
              Organization <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="organization"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    id="organization"
                    className={errors.organization ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATIONS.map((org) => (
                      <SelectItem key={org} value={org}>
                        {org}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.organization && (
              <p className="text-sm text-destructive">{errors.organization.message}</p>
            )}
          </div>

          {/* Mobile Phone */}
          <div className="space-y-2">
            <Label htmlFor="mobilePhone">
              Mobile Phone <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="mobilePhone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter mobile phone number"
                  className={errors.mobilePhone ? 'border-destructive' : ''}
                />
              )}
            />
            {errors.mobilePhone && (
              <p className="text-sm text-destructive">{errors.mobilePhone.message}</p>
            )}
          </div>

          {/* Service Provider Role */}
          <div className="space-y-2">
            <Label htmlFor="serviceProviderRole">
              Service Provider Role <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="serviceProviderRole"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    id="serviceProviderRole"
                    className={errors.serviceProviderRole ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_PROVIDER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.serviceProviderRole && (
              <p className="text-sm text-destructive">{errors.serviceProviderRole.message}</p>
            )}
          </div>

          {/* Specializations - Only show if Staff role selected */}
          {serviceProviderRole === 'Staff' && (
            <div className="space-y-2">
              <Label htmlFor="specializations">Specializations</Label>
              <Controller
                name="specializations"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="specializations">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map((specialization) => (
                        <SelectItem key={specialization} value={specialization}>
                          {specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Fax Phone */}
          <div className="space-y-2">
            <Label htmlFor="faxPhone">
              Fax Phone <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Controller
              name="faxPhone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter fax phone number (optional)"
                />
              )}
            />
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
          Reset Form
        </Button>
        <Button type="submit" form="provider-form" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Service Provider'}
        </Button>
      </CardFooter>
    </Card>
  );
}
