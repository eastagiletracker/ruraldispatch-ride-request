import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDocument } from "../utils/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { vehicleFormSchema, type VehicleFormData } from "@/schemas/validation";

export default function CreateVehicle() {
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<VehicleFormData>({
        resolver: zodResolver(vehicleFormSchema),
        defaultValues: {
            displayName: '',
            fleetId: '',
            capacity: 0,
            serviceArea: '',
            accessibilityFeatures: ''
        }
    });

    const onSubmit = async (data: VehicleFormData) => {
        setSubmitError('');
        setSubmitSuccess(false);
        
        try {
            // Backend will generate UUID
            const response = await createDocument("vehicles", data);

            if (response.ok) {
                setSubmitSuccess(true);
                toast.success('Vehicle created successfully!', {
                    description: `${data.displayName} has been added to the fleet.`
                });

                // Reset form
                reset();
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Please try again.';
                setSubmitError(errorMessage);
                toast.error('Failed to create vehicle', {
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

    const handleReset = () => {
        reset();
        setSubmitSuccess(false);
        setSubmitError('');
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create Vehicle</CardTitle>
                <CardDescription>
                    Fill in the information to add a new vehicle to the fleet
                </CardDescription>
            </CardHeader>

            <CardContent>
                {submitSuccess && (
                    <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
                        <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                            Vehicle created successfully!
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="vehicle-form">
                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="displayName">
                            Display Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="displayName"
                            {...register('displayName')}
                            placeholder="e.g., Van #1, Blue Sedan"
                            className={errors.displayName ? 'border-destructive' : ''}
                        />
                        {errors.displayName && (
                            <p className="text-sm text-destructive">{errors.displayName.message}</p>
                        )}
                    </div>

                    {/* Fleet ID */}
                    <div className="space-y-2">
                        <Label htmlFor="fleetId">
                            Fleet ID <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="fleetId"
                            {...register('fleetId')}
                            placeholder="Enter fleet identification number"
                            className={errors.fleetId ? 'border-destructive' : ''}
                        />
                        {errors.fleetId && (
                            <p className="text-sm text-destructive">{errors.fleetId.message}</p>
                        )}
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                        <Label htmlFor="capacity">
                            Capacity <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="capacity"
                            type="number"
                            min="1"
                            {...register('capacity', { valueAsNumber: true })}
                            placeholder="Number of passengers"
                            className={errors.capacity ? 'border-destructive' : ''}
                        />
                        {errors.capacity && (
                            <p className="text-sm text-destructive">{String(errors.capacity.message)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Maximum number of passengers</p>
                    </div>

                    {/* Service Area */}
                    <div className="space-y-2">
                        <Label htmlFor="serviceArea">
                            Service Area <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="serviceArea"
                            {...register('serviceArea')}
                            placeholder="e.g., Downtown, North County"
                            className={errors.serviceArea ? 'border-destructive' : ''}
                        />
                        {errors.serviceArea && (
                            <p className="text-sm text-destructive">{errors.serviceArea.message}</p>
                        )}
                    </div>

                    {/* Accessibility Features */}
                    <div className="space-y-2">
                        <Label htmlFor="accessibilityFeatures">
                            Accessibility Features <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="accessibilityFeatures"
                            {...register('accessibilityFeatures')}
                            placeholder="e.g., Wheelchair accessible, Walker storage"
                            className={errors.accessibilityFeatures ? 'border-destructive' : ''}
                        />
                        {errors.accessibilityFeatures && (
                            <p className="text-sm text-destructive">{errors.accessibilityFeatures.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            List special accessibility features and equipment
                        </p>
                    </div>
                </form>
            </CardContent>

            <CardFooter className="flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSubmitting}
                >
                    Reset Form
                </Button>
                <Button
                    type="submit"
                    form="vehicle-form"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating...' : 'Create Vehicle'}
                </Button>
            </CardFooter>
        </Card>
    );
}
