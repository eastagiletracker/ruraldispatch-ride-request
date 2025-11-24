import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import { getApiUrl } from '@/lib/api';

interface RiderFormData {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  smsConsentGiven?: boolean;
}

interface Rider {
  uuid: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  smsConsentGiven?: boolean;
}

interface RiderEditModalProps {
  rider: Rider;
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

export function RiderEditModal({ rider, open, onClose, onSuccess }: RiderEditModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RiderFormData>({
    defaultValues: {
      fullName: rider.fullName,
      phone: rider.phone,
      email: rider.email || '',
      address: rider.address || '',
      smsConsentGiven: rider.smsConsentGiven || false,
    },
  });

  const smsConsentGiven = watch('smsConsentGiven');

  useEffect(() => {
    reset({
      fullName: rider.fullName,
      phone: rider.phone,
      email: rider.email || '',
      address: rider.address || '',
      smsConsentGiven: rider.smsConsentGiven || false,
    });
  }, [rider, reset]);

  const onSubmit = async (data: RiderFormData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(getApiUrl(`/api/users/${rider.uuid}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update rider');
      }

      toast.success('Rider updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating rider:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update rider';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Rider</DialogTitle>
          <DialogDescription>Update rider information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="e.g., John Smith"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., (555) 123-4567"
                {...register('phone', { required: 'Phone is required' })}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., john@example.com"
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main St, City, State"
                {...register('address')}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="smsConsentGiven" className="text-base">
                  SMS Consent
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow sending SMS notifications to this rider
                </p>
              </div>
              <Switch
                id="smsConsentGiven"
                checked={smsConsentGiven}
                onCheckedChange={(checked) => setValue('smsConsentGiven', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Rider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
