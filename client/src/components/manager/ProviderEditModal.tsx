import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { getApiUrl } from '@/lib/api';
import type { Organization, ServiceProviderRole, Specialization } from '@/types';

const ORGANIZATIONS: Organization[] = ['EASTCONN', 'Generations Health'];

const SERVICE_PROVIDER_ROLES: ServiceProviderRole[] = [
  'Transport Broker',
  'Staff',
  'Fleet Manager',
  'Driver',
  'Admin',
];

const SPECIALIZATIONS: Specialization[] = ['Caseworker', 'Nutritionist', 'Intake'];

interface ProviderFormData {
  fullName: string;
  title: string;
  organization: string;
  mobilePhone: string;
  serviceProviderRole: string;
  specializations?: string;
  faxPhone?: string;
}

interface ServiceProvider {
  uuid: string;
  fullName: string;
  title?: string;
  role: string;
  mobilePhone?: string;
  organization?: {
    name?: string;
  };
}

interface ProviderEditModalProps {
  provider: ServiceProvider;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

export function ProviderEditModal({ provider, open, onClose, onSuccess }: ProviderEditModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProviderFormData>({
    defaultValues: {
      fullName: provider.fullName,
      title: provider.title || '',
      organization: provider.organization?.name || '',
      mobilePhone: provider.mobilePhone || '',
      serviceProviderRole: provider.role || 'Driver',
      specializations: '',
      faxPhone: '',
    },
  });

  const serviceProviderRole = watch('serviceProviderRole');

  useEffect(() => {
    reset({
      fullName: provider.fullName,
      title: provider.title || '',
      organization: provider.organization?.name || '',
      mobilePhone: provider.mobilePhone || '',
      serviceProviderRole: provider.role || 'Driver',
      specializations: '',
      faxPhone: '',
    });
  }, [provider, reset]);

  const onSubmit = async (data: ProviderFormData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(getApiUrl(`/api/providers/${provider.uuid}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update service provider');
      }

      toast.success('Service provider updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating provider:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update provider';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Provider</DialogTitle>
          <DialogDescription>Update service provider information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Enter full name"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter title"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="organization">
                Organization <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="organization"
                control={control}
                rules={{ required: 'Organization is required' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="organization"
                      className={errors.organization ? 'border-red-500' : ''}
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
                <p className="text-sm text-red-500">{errors.organization.message}</p>
              )}
            </div>

            {/* Mobile Phone */}
            <div className="space-y-2">
              <Label htmlFor="mobilePhone">
                Mobile Phone <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="mobilePhone"
                control={control}
                rules={{ required: 'Mobile phone is required' }}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter mobile phone number"
                    className={errors.mobilePhone ? 'border-red-500' : ''}
                  />
                )}
              />
              {errors.mobilePhone && (
                <p className="text-sm text-red-500">{errors.mobilePhone.message}</p>
              )}
            </div>

            {/* Service Provider Role */}
            <div className="space-y-2">
              <Label htmlFor="serviceProviderRole">
                Service Provider Role <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="serviceProviderRole"
                control={control}
                rules={{ required: 'Service provider role is required' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="serviceProviderRole"
                      className={errors.serviceProviderRole ? 'border-red-500' : ''}
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
                <p className="text-sm text-red-500">{errors.serviceProviderRole.message}</p>
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
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Enter fax phone number (optional)"
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Provider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
