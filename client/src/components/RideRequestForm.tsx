import { useState, useEffect } from 'react';
import { createDocument } from "../utils/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { 
    RideRequestFormData, 
    RideRequestFormErrors, 
    RideRequestFormProps 
} from "@/types/form";

export default function RideRequestForm({ selectedUser, setShowRideRequestForm, setShowBaseForm, setShowUserForm }: RideRequestFormProps) {
    const [formData, setFormData] = useState<RideRequestFormData>({
        riderName: '',
        riderPickupBaseAddress: '',
        rideRequestType: 'Standard',
        accessibilityNeeds: 'None',
        pickupSameAsBase: false,
        pickupLocation: '',
        dropoffLocation: '',
        roundtrip: false,
        estimatedWaitTime: '',
        pickupRequestedDate: '',
        pickupRequestedTime: '',
        dropoffRequestedDate: '',
        dropoffRequestedTime: ''
    });

    const [errors, setErrors] = useState<RideRequestFormErrors>({});
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Update rider name when selectedUser changes
    useEffect(() => {
        if (selectedUser) {
            setFormData(prev => ({
                ...prev,
                riderName: selectedUser.fullName,
                riderPickupBaseAddress: selectedUser.residence?.current || selectedUser.residence?.last || ''
            }));
        }
    }, [selectedUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value?: string; type?: string; checked?: boolean } }) => {
        const { name, value, type, checked } = e.target;

        if (name === 'pickupSameAsBase') {
            setFormData(prev => ({
                ...prev,
                pickupSameAsBase: checked,
                pickupLocation: checked ? prev.riderPickupBaseAddress : ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSelectChange = (name: keyof RideRequestFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: RideRequestFormErrors = {};

        if (!formData.riderName.trim()) newErrors.riderName = 'Rider name is required';
        if (!formData.riderPickupBaseAddress.trim()) newErrors.riderPickupBaseAddress = 'Rider pickup base address is required';
        if (!formData.pickupLocation.trim()) newErrors.pickupLocation = 'Pickup location is required';
        if (!formData.dropoffLocation.trim()) newErrors.dropoffLocation = 'Drop-off location is required';
        if (!formData.pickupRequestedDate) newErrors.pickupRequestedDate = 'Pickup requested date is required';
        if (!formData.pickupRequestedTime) newErrors.pickupRequestedTime = 'Pickup requested time is required';
        if (!formData.dropoffRequestedDate) newErrors.dropoffRequestedDate = 'Dropoff requested date is required';
        if (!formData.dropoffRequestedTime) newErrors.dropoffRequestedTime = 'Dropoff requested time is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess(false);

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const rideRequestData = {
                uuid: Date.now(),
                serviceUserUuid: selectedUser?.uuid || '',
                serviceUserRole: 'rider',
                pickupAddress: formData.pickupLocation,
                dropOffAddress: formData.dropoffLocation,
                roundTrip: formData.roundtrip,
                pickupRequestedTime: `${formData.pickupRequestedDate}T${formData.pickupRequestedTime}`,
                dropOffRequestedTime: `${formData.dropoffRequestedDate}T${formData.dropoffRequestedTime}`,
                rideStartedActualTime: new Date(),
                pickupActualTime: new Date(),
                dropOffActualTime: new Date(),
                rideCompleteRequestedTime: new Date(),
                rideCompleteActualTime: new Date(),
                rideStatus: 0,
                purpose: formData.rideRequestType,
                rideRequestStatus: 100,
                notes: `Accessibility: ${formData.accessibilityNeeds || 'None'}. Wait time: ${formData.estimatedWaitTime || 'Not specified'}`
            };

            const response = await createDocument("riderequests", rideRequestData);

            if (response.ok) {
                setSubmitSuccess(true);
                toast.success('Ride request created successfully!', {
                    description: `Request for ${formData.riderName} has been submitted.`
                });
                // Reset form
                setFormData({
                    riderName: '',
                    riderPickupBaseAddress: '',
                    rideRequestType: 'Standard',
                    accessibilityNeeds: 'None',
                    pickupSameAsBase: false,
                    pickupLocation: '',
                    dropoffLocation: '',
                    roundtrip: false,
                    estimatedWaitTime: '',
                    pickupRequestedDate: '',
                    pickupRequestedTime: '',
                    dropoffRequestedDate: '',
                    dropoffRequestedTime: ''
                });
                setErrors({});
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
            const errorMessage = 'Error submitting form. Please try again.';
            setSubmitError(errorMessage);
            toast.error('Error submitting form', {
                description: 'Please try again or contact support.'
            });
        }
    };

    const handleCancel = () => {
        setFormData({
            riderName: '',
            riderPickupBaseAddress: '',
            rideRequestType: 'Standard',
            accessibilityNeeds: 'None',
            pickupSameAsBase: false,
            pickupLocation: '',
            dropoffLocation: '',
            roundtrip: false,
            estimatedWaitTime: '',
            pickupRequestedDate: '',
            pickupRequestedTime: '',
            dropoffRequestedDate: '',
            dropoffRequestedTime: ''
        });
        setErrors({});
        setShowRideRequestForm(false);
        setShowBaseForm(true);
        setShowUserForm(false);
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Ride Request Form</CardTitle>
                <CardDescription>
                    Fill in Rider information to submit a Ride Request
                </CardDescription>
            </CardHeader>

            <CardContent>
                {submitSuccess && (
                    <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
                        <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                            Ride request created successfully!
                        </AlertDescription>
                    </Alert>
                )}

                {submitError && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rider Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Rider Name</Label>
                            <p className="text-lg font-medium">{selectedUser.fullName}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="riderPickupBaseAddress">Rider Pickup Base Address</Label>
                            <Input
                                id="riderPickupBaseAddress"
                                name="riderPickupBaseAddress"
                                value={formData.riderPickupBaseAddress}
                                onChange={handleInputChange}
                                placeholder="Enter base address"
                                className={errors.riderPickupBaseAddress ? 'border-destructive' : ''}
                            />
                            {errors.riderPickupBaseAddress && (
                                <p className="text-sm text-destructive">{errors.riderPickupBaseAddress}</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Ride Request Type and Accessibility */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Ride Request Type</Label>
                            <Select
                                value={formData.rideRequestType}
                                onValueChange={(value) => handleSelectChange('rideRequestType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Standard">Standard</SelectItem>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                    <SelectItem value="Medical">Medical</SelectItem>
                                    <SelectItem value="Shopping">Shopping</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Accessibility Needs</Label>
                            <Select
                                value={formData.accessibilityNeeds}
                                onValueChange={(value) => handleSelectChange('accessibilityNeeds', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select accessibility needs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    <SelectItem value="Walker Accessible">Walker Accessible</SelectItem>
                                    <SelectItem value="Wheelchair Accessible">Wheelchair Accessible</SelectItem>
                                    <SelectItem value="Oxygen Tank Accessible">Oxygen Tank Accessible</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Pickup Location Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="pickupSameAsBase"
                            checked={formData.pickupSameAsBase}
                            onCheckedChange={(checked) =>
                                handleInputChange({
                                    target: { name: 'pickupSameAsBase', type: 'checkbox', checked: checked as boolean }
                                })
                            }
                        />
                        <Label
                            htmlFor="pickupSameAsBase"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Check if Pickup Location is the same as Base Address
                        </Label>
                    </div>

                    {/* Location Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="pickupLocation">Pickup Location</Label>
                            <Input
                                id="pickupLocation"
                                name="pickupLocation"
                                value={formData.pickupLocation}
                                onChange={handleInputChange}
                                placeholder="Enter pickup address"
                                className={errors.pickupLocation ? 'border-destructive' : ''}
                            />
                            {errors.pickupLocation && (
                                <p className="text-sm text-destructive">{errors.pickupLocation}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dropoffLocation">Drop-off Location</Label>
                            <Input
                                id="dropoffLocation"
                                name="dropoffLocation"
                                value={formData.dropoffLocation}
                                onChange={handleInputChange}
                                placeholder="Enter drop-off address"
                                className={errors.dropoffLocation ? 'border-destructive' : ''}
                            />
                            {errors.dropoffLocation && (
                                <p className="text-sm text-destructive">{errors.dropoffLocation}</p>
                            )}
                        </div>
                    </div>

                    {/* Roundtrip and Wait Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="roundtrip"
                                checked={formData.roundtrip}
                                onCheckedChange={(checked) =>
                                    handleInputChange({
                                        target: { name: 'roundtrip', type: 'checkbox', checked: checked as boolean }
                                    })
                                }
                            />
                            <Label htmlFor="roundtrip">Roundtrip</Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="estimatedWaitTime">Estimated Wait Time (Optional)</Label>
                            <Input
                                id="estimatedWaitTime"
                                name="estimatedWaitTime"
                                value={formData.estimatedWaitTime}
                                onChange={handleInputChange}
                                placeholder="ex. 1 hour"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Date and Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="pickupRequestedDate">Pickup Requested Date</Label>
                            <Input
                                id="pickupRequestedDate"
                                type="date"
                                name="pickupRequestedDate"
                                value={formData.pickupRequestedDate}
                                onChange={handleInputChange}
                                className={errors.pickupRequestedDate ? 'border-destructive' : ''}
                            />
                            {errors.pickupRequestedDate && (
                                <p className="text-sm text-destructive">{errors.pickupRequestedDate}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pickupRequestedTime">Pickup Requested Time</Label>
                            <Input
                                id="pickupRequestedTime"
                                type="time"
                                name="pickupRequestedTime"
                                value={formData.pickupRequestedTime}
                                onChange={handleInputChange}
                                className={errors.pickupRequestedTime ? 'border-destructive' : ''}
                            />
                            {errors.pickupRequestedTime && (
                                <p className="text-sm text-destructive">{errors.pickupRequestedTime}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dropoffRequestedDate">Dropoff Requested Date</Label>
                            <Input
                                id="dropoffRequestedDate"
                                type="date"
                                name="dropoffRequestedDate"
                                value={formData.dropoffRequestedDate}
                                onChange={handleInputChange}
                                className={errors.dropoffRequestedDate ? 'border-destructive' : ''}
                            />
                            {errors.dropoffRequestedDate && (
                                <p className="text-sm text-destructive">{errors.dropoffRequestedDate}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dropoffRequestedTime">Dropoff Requested Time</Label>
                            <Input
                                id="dropoffRequestedTime"
                                type="time"
                                name="dropoffRequestedTime"
                                value={formData.dropoffRequestedTime}
                                onChange={handleInputChange}
                                className={errors.dropoffRequestedTime ? 'border-destructive' : ''}
                            />
                            {errors.dropoffRequestedTime && (
                                <p className="text-sm text-destructive">{errors.dropoffRequestedTime}</p>
                            )}
                        </div>
                    </div>
                </form>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={handleSubmit}
                >
                    Submit Request
                </Button>
            </CardFooter>
        </Card>
    );
}
