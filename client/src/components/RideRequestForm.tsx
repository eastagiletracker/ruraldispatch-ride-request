import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDocument } from "../utils/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, User, Phone, Building2, Accessibility, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { rideRequestFormSchema, type RideRequestFormData } from "@/schemas/validation";
import type { RideRequestFormProps } from "@/types/form";

export default function RideRequestForm({
    selectedUser,
    setShowRideRequestForm,
    setShowBaseForm,
    setShowUserForm,
    caseManagerName,
    caseManagerUsername
}: RideRequestFormProps) {
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string>('');

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting },
        reset
    } = useForm<RideRequestFormData>({
        resolver: zodResolver(rideRequestFormSchema),
        mode: 'onSubmit',
        defaultValues: {
            caseManagerFullName: caseManagerName || '',
            caseManagerAgency: '',
            caseManagerPhone: '',
            riderFullName: selectedUser?.fullName || '',
            riderMobilePhone: selectedUser?.phone || '',
            pickupLocation: '',
            dropoffLocation: '',
            roundtrip: false,
            pickupRequestedDate: '',
            pickupRequestedTime: '',
            estimatedWaitTime: '',
            walkerAccessible: false,
            wheelchairAccessible: false,
            serviceAnimalFriendly: false,
            oxygenTankAccessible: false,
            purposeOfTrip: '',
            notesComments: ''
        }
    });

    // Update rider info when selectedUser changes
    useEffect(() => {
        if (selectedUser) {
            reset({
                caseManagerFullName: caseManagerName || '',
                caseManagerAgency: '',
                caseManagerPhone: '',
                riderFullName: selectedUser.fullName,
                riderMobilePhone: selectedUser.phone || '',
                pickupLocation: '',
                dropoffLocation: '',
                roundtrip: false,
                pickupRequestedDate: '',
                pickupRequestedTime: '',
                estimatedWaitTime: '',
                walkerAccessible: false,
                wheelchairAccessible: false,
                serviceAnimalFriendly: false,
                oxygenTankAccessible: false,
                purposeOfTrip: '',
                notesComments: ''
            }, { keepDefaultValues: false });
        }
    }, [selectedUser, caseManagerName, reset]);

    const onSubmit = async (data: RideRequestFormData) => {
        setSubmitError('');
        setSubmitSuccess(false);

        try {
            // Build accessibility features string
            const accessibilityFeatures = [];
            if (data.walkerAccessible) accessibilityFeatures.push('Walker Accessible');
            if (data.wheelchairAccessible) accessibilityFeatures.push('Wheelchair Accessible');
            if (data.serviceAnimalFriendly) accessibilityFeatures.push('Service Animal Friendly');
            if (data.oxygenTankAccessible) accessibilityFeatures.push('Oxygen Tank/Medical Device Accessible');

            const rideRequestData = {
                serviceUserUuid: selectedUser?.uuid || '',
                serviceUserRole: 'rider',
                pickupAddress: data.pickupLocation,
                dropOffAddress: data.dropoffLocation,
                roundTrip: data.roundtrip || false,
                pickupRequestedTime: `${data.pickupRequestedDate}T${data.pickupRequestedTime}`,
                dropOffRequestedTime: `${data.pickupRequestedDate}T${data.pickupRequestedTime}`,
                rideStartedActualTime: new Date(),
                pickupActualTime: new Date(),
                dropOffActualTime: new Date(),
                rideCompleteRequestedTime: new Date(),
                rideCompleteActualTime: new Date(),
                rideStatus: 0,
                purpose: data.purposeOfTrip,
                rideRequestStatus: 100,
                notes: `Case Manager: ${data.caseManagerFullName} (${data.caseManagerAgency}, ${data.caseManagerPhone}). ` +
                       `Rider Phone: ${data.riderMobilePhone}. ` +
                       `Accessibility: ${accessibilityFeatures.join(', ') || 'None'}. ` +
                       `Wait time: ${data.estimatedWaitTime || 'Not specified'}. ` +
                       `${data.notesComments || ''}`
            };

            const response = await createDocument("riderequests", rideRequestData);

            if (response.ok) {
                setSubmitSuccess(true);
                toast.success('Ride request created successfully!', {
                    description: `Request for ${data.riderFullName} has been submitted.`
                });

                // Reset and return to base form after a short delay
                setTimeout(() => {
                    reset();
                    handleCancel();
                }, 1500);
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Failed to create ride request';
                setSubmitError(errorMessage);
                toast.error('Failed to create ride request', {
                    description: errorMessage
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = 'Please try again or contact support.';
            setSubmitError(errorMessage);
            toast.error('Error submitting form', {
                description: errorMessage
            });
        }
    };

    const handleCancel = () => {
        reset();
        setSubmitSuccess(false);
        setSubmitError('');
        if (setShowRideRequestForm) setShowRideRequestForm(false);
        if (setShowBaseForm) setShowBaseForm(true);
        if (setShowUserForm) setShowUserForm(false);
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create Ride Request</CardTitle>
                <CardDescription>
                    Fill in the information to submit a ride request for {selectedUser?.fullName}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {submitSuccess && (
                    <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
                        <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                            Ride request created successfully! Redirecting...
                        </AlertDescription>
                    </Alert>
                )}

                {submitError && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {submitError}
                        </AlertDescription>
                    </Alert>
                )}

                <form key={selectedUser?.uuid} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Case Manager Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Case Manager Information</h3>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="caseManagerFullName">
                                    Case Manager's Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="caseManagerFullName"
                                    {...register('caseManagerFullName')}
                                    placeholder="Enter case manager name"
                                    className={errors.caseManagerFullName ? 'border-destructive' : ''}
                                />
                                {errors.caseManagerFullName && (
                                    <p className="text-sm text-destructive">{errors.caseManagerFullName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="caseManagerAgency">
                                    Case Manager's Agency <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="caseManagerAgency"
                                    {...register('caseManagerAgency')}
                                    placeholder="Enter agency name"
                                    className={errors.caseManagerAgency ? 'border-destructive' : ''}
                                />
                                {errors.caseManagerAgency && (
                                    <p className="text-sm text-destructive">{errors.caseManagerAgency.message}</p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="caseManagerPhone">
                                    Case Manager's Phone Number <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="caseManagerPhone"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="+1 (555) 000-0000"
                                            className={errors.caseManagerPhone ? 'border-destructive' : ''}
                                        />
                                    )}
                                />
                                {errors.caseManagerPhone && (
                                    <p className="text-sm text-destructive">{errors.caseManagerPhone.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rider Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Rider Information</h3>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="riderFullName">
                                    Rider's Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="riderFullName"
                                    {...register('riderFullName')}
                                    placeholder="Enter rider name"
                                    className={errors.riderFullName ? 'border-destructive' : ''}
                                />
                                {errors.riderFullName && (
                                    <p className="text-sm text-destructive">{errors.riderFullName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="riderMobilePhone">
                                    Rider's Mobile Phone Number <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="riderMobilePhone"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            {...field}
                                            placeholder="+1 (555) 000-0000"
                                            className={errors.riderMobilePhone ? 'border-destructive' : ''}
                                        />
                                    )}
                                />
                                {errors.riderMobilePhone && (
                                    <p className="text-sm text-destructive">{errors.riderMobilePhone.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ride Details Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Ride Request</h3>
                        </div>
                        <Separator />
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pickupLocation">
                                    Pickup Location <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="pickupLocation"
                                    {...register('pickupLocation')}
                                    placeholder="Enter pickup address"
                                    className={errors.pickupLocation ? 'border-destructive' : ''}
                                />
                                {errors.pickupLocation && (
                                    <p className="text-sm text-destructive">{errors.pickupLocation.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dropoffLocation">
                                    Drop-off Location <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="dropoffLocation"
                                    {...register('dropoffLocation')}
                                    placeholder="Enter drop-off address"
                                    className={errors.dropoffLocation ? 'border-destructive' : ''}
                                />
                                {errors.dropoffLocation && (
                                    <p className="text-sm text-destructive">{errors.dropoffLocation.message}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="roundtrip"
                                    {...register('roundtrip')}
                                />
                                <Label htmlFor="roundtrip" className="cursor-pointer">
                                    Round trip
                                </Label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pickupRequestedDate">
                                        Pickup Date <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="pickupRequestedDate"
                                        type="date"
                                        {...register('pickupRequestedDate')}
                                        className={errors.pickupRequestedDate ? 'border-destructive' : ''}
                                    />
                                    {errors.pickupRequestedDate && (
                                        <p className="text-sm text-destructive">{errors.pickupRequestedDate.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pickupRequestedTime">
                                        Pickup Time <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="pickupRequestedTime"
                                        type="time"
                                        {...register('pickupRequestedTime')}
                                        className={errors.pickupRequestedTime ? 'border-destructive' : ''}
                                    />
                                    {errors.pickupRequestedTime && (
                                        <p className="text-sm text-destructive">{errors.pickupRequestedTime.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="estimatedWaitTime">
                                        Estimated Wait Time
                                    </Label>
                                    <Input
                                        id="estimatedWaitTime"
                                        {...register('estimatedWaitTime')}
                                        placeholder="e.g., 15 minutes"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accessibility Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Accessibility className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Additional Ride Information</h3>
                        </div>
                        <Separator />
                        
                        <p className="text-sm font-medium text-muted-foreground">Accessibility Feature Type</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="walkerAccessible"
                                    {...register('walkerAccessible')}
                                />
                                <Label htmlFor="walkerAccessible" className="cursor-pointer">
                                    Walker Accessible
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="wheelchairAccessible"
                                    {...register('wheelchairAccessible')}
                                />
                                <Label htmlFor="wheelchairAccessible" className="cursor-pointer">
                                    Wheelchair Accessible
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="serviceAnimalFriendly"
                                    {...register('serviceAnimalFriendly')}
                                />
                                <Label htmlFor="serviceAnimalFriendly" className="cursor-pointer">
                                    Service Animal Friendly
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="oxygenTankAccessible"
                                    {...register('oxygenTankAccessible')}
                                />
                                <Label htmlFor="oxygenTankAccessible" className="cursor-pointer">
                                    Oxygen Tank/Medical Device Accessible
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Purpose and Notes Section */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="purposeOfTrip">
                                Purpose of Trip <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-sm text-muted-foreground">Let us know why you need a ride.</p>
                            <Textarea
                                id="purposeOfTrip"
                                {...register('purposeOfTrip')}
                                placeholder="Ex. I need to go to a doctor's appointment"
                                rows={4}
                                className={errors.purposeOfTrip ? 'border-destructive' : ''}
                            />
                            {errors.purposeOfTrip && (
                                <p className="text-sm text-destructive">{errors.purposeOfTrip.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notesComments">
                                Notes/Comments
                            </Label>
                            <p className="text-sm text-muted-foreground">Let your driver know if you have additional needs or concerns for this ride.</p>
                            <Textarea
                                id="notesComments"
                                {...register('notesComments')}
                                placeholder="Ex. I will have my child with me for this ride. Or I need help getting to the vehicle."
                                rows={4}
                            />
                        </div>
                    </div>
                </form>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating...' : 'Create Ride Request'}
                </Button>
            </CardFooter>
        </Card>
    );
}
