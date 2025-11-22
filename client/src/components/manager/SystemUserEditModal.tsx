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
import { getApiUrl } from '@/lib/api';

interface SystemUserFormData {
  username: string;
  password?: string;
  fullName: string;
}

interface SystemUser {
  uuid: string;
  username: string;
  fullName: string;
  role: string;
  isActive?: boolean;
}

interface SystemUserEditModalProps {
  user: SystemUser;
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

export function SystemUserEditModal({ user, open, onClose, onSuccess }: SystemUserEditModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SystemUserFormData>({
    defaultValues: {
      username: user.username,
      fullName: user.fullName,
      password: '',
    },
  });

  useEffect(() => {
    reset({
      username: user.username,
      fullName: user.fullName,
      password: '',
    });
  }, [user, reset]);

  const onSubmit = async (data: SystemUserFormData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const updateData: any = {
        username: data.username,
        fullName: data.fullName,
      };

      // Only include password if it was provided
      if (data.password && data.password.length > 0) {
        updateData.password = data.password;
      }

      const response = await fetch(getApiUrl(`/api/auth/system-users/${user.uuid}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user');
      }

      toast.success('User updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const userTypeLabel = user.role === 'dispatcher' ? 'Dispatcher' : 'Case Manager';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit {userTypeLabel}</DialogTitle>
          <DialogDescription>Update {userTypeLabel.toLowerCase()} information</DialogDescription>
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
                Password{' '}
                <span className="text-muted-foreground">(leave blank to keep current)</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password', {
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
              {submitting ? 'Updating...' : `Update ${userTypeLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
