import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
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
import { getApiUrl } from '@/lib/api';

interface SystemUserFormData {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

interface SystemUserAddModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userType: 'dispatcher' | 'case_manager';
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

export function SystemUserAddModal({
  open,
  onClose,
  onSuccess,
  userType,
}: SystemUserAddModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SystemUserFormData>({
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      role: userType,
    },
  });

  const onSubmit = async (data: SystemUserFormData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(getApiUrl('/api/auth/system-users'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          uuid: crypto.randomUUID(),
          role: userType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to create ${userType === 'dispatcher' ? 'dispatcher' : 'case manager'}`
        );
      }

      toast.success(
        `${userType === 'dispatcher' ? 'Dispatcher' : 'Case manager'} added successfully`
      );
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error creating ${userType}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to create ${userType}`;
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const title = userType === 'dispatcher' ? 'Add New Dispatcher' : 'Add New Case Manager';
  const description =
    userType === 'dispatcher'
      ? 'Create a new dispatcher account'
      : 'Create a new case manager account';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                placeholder="e.g., jdoe@example.com"
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="e.g., John Doe"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Adding...'
                : `Add ${userType === 'dispatcher' ? 'Dispatcher' : 'Case Manager'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
