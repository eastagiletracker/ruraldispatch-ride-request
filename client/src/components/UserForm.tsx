import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceUserRoles, type UserFormData, userFormSchema } from '@shared/schemas';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import { getApiUrl } from '@/lib/api';
import type { FormComponentProps, ServiceUserRole } from '@/types';
import { createDocument } from '../utils/database';

const SERVICE_USER_ROLES: ServiceUserRole[] = [...ServiceUserRoles];

export default function UserForm({ setShowBaseForm, setShowUserForm }: FormComponentProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [smsConsent, setSmsConsent] = useState<boolean>(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: '',
      phone: '',
      dob: '',
      race: '',
      maritalStatus: '',
      residence: {
        current: null,
        last: null,
      },
      income: {
        current: '',
        last: '',
      },
      serviceUserRole: [],
      veteranStatus: '',
      disabilityStatus: '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Helper to extract address string from AddressType or string
      const getAddressString = (location: any): string => {
        if (!location) return '';
        return typeof location === 'string' ? location : location.formattedAddress;
      };

      // Convert address objects to strings for backend
      const submitData = {
        ...data,
        residence: {
          current: getAddressString(data.residence.current),
          last: getAddressString(data.residence.last),
        },
      };

      const response = await createDocument('users', submitData);

      if (response.ok) {
        // If SMS consent was given, record it
        if (smsConsent && data.phone) {
          try {
            await fetch(getApiUrl('/api/users/sms-consent'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phoneNumber: data.phone,
                consentGiven: true,
                timestamp: new Date().toISOString(),
                ipAddress: window.location.hostname,
              }),
            });
          } catch (smsError) {
            console.error('Error recording SMS consent:', smsError);
            // Don't fail the whole registration if SMS consent fails
          }
        }

        setSubmitSuccess(true);
        toast.success('User created successfully!', {
          description: `${data.fullName} has been added to the system.`,
        });

        // Reset form
        reset();
        setSmsConsent(true);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Please try again.';
        setSubmitError(errorMessage);
        toast.error('Failed to create user', {
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setSmsConsent(true);
    setSubmitSuccess(false);
    setSubmitError('');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>User Registration Form</CardTitle>
        <CardDescription>Fill in the information to create a new user</CardDescription>
      </CardHeader>

      <CardContent>
        {submitSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>User created successfully!</AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-sm text-destructive">{String(errors.fullName.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter phone number"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{String(errors.phone.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dob"
                type="date"
                {...register('dob')}
                className={errors.dob ? 'border-destructive' : ''}
              />
              {errors.dob && (
                <p className="text-sm text-destructive">{String(errors.dob.message)}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="race">
                Race <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="race"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.race ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select race" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="asian">Asian</SelectItem>
                      <SelectItem value="latino">Latino</SelectItem>
                      <SelectItem value="native american">Native American</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.race && (
                <p className="text-sm text-destructive">{String(errors.race.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maritalStatus">
                Marital Status <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="maritalStatus"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.maritalStatus ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.maritalStatus && (
                <p className="text-sm text-destructive">{String(errors.maritalStatus.message)}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Residence Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Residence Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="residence.current"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={typeof field.value === 'string' ? null : field.value}
                    onChange={field.onChange}
                    label="Current Residence"
                    placeholder="Search for current residence..."
                    required={false}
                    error={!!errors.residence?.current}
                    errorMessage={errors.residence?.current?.message as string}
                    includedRegionCodes={['US']}
                  />
                )}
              />

              <Controller
                name="residence.last"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={typeof field.value === 'string' ? null : field.value}
                    onChange={field.onChange}
                    label="Last Residence"
                    placeholder="Search for last residence..."
                    required
                    error={!!errors.residence?.last}
                    errorMessage={errors.residence?.last?.message as string}
                    includedRegionCodes={['US']}
                  />
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Income Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Income Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="income.current">
                  Current Income <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="income.current"
                  {...register('income.current')}
                  placeholder="Enter current income"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income.last">
                  Last Income <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="income.last"
                  {...register('income.last')}
                  placeholder="Enter last income"
                  className={errors.income?.last ? 'border-destructive' : ''}
                />
                {errors.income?.last && (
                  <p className="text-sm text-destructive">{String(errors.income.last.message)}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Service User Role */}
          <div className="space-y-3">
            <Label>
              Service User Role(s) <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">Select all that apply</p>
            <Controller
              name="serviceUserRole"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {SERVICE_USER_ROLES.map((role) => (
                    <label key={role} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        id={`role-${role}`}
                        checked={field.value.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, role]);
                          } else {
                            field.onChange(field.value.filter((r) => r !== role));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`role-${role}`}
                        className="capitalize font-normal cursor-pointer"
                      >
                        {role}
                      </Label>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.serviceUserRole && (
              <p className="text-sm text-destructive">{String(errors.serviceUserRole.message)}</p>
            )}
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="veteranStatus">
                Veteran Status <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Controller
                name="veteranStatus"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select veteran status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veteran">Veteran</SelectItem>
                      <SelectItem value="not veteran">Not Veteran</SelectItem>
                      <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disabilityStatus">
                Disability Status <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Controller
                name="disabilityStatus"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select disability status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <Separator />
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowBaseForm(true);
            setShowUserForm(false);
          }}
          disabled={submitting}
        >
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitting}>
            Reset Form
          </Button>
          <Button type="submit" disabled={submitting} onClick={handleSubmit(onSubmit)}>
            {submitting ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
