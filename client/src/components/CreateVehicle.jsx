import { useState } from 'react';
import { createDocument } from "../utils/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const generateUUID = () => {
    return 'xxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export default function CreateVehicle() {
    const [formData, setFormData] = useState({
        uuid: generateUUID(),
        displayName: '',
        fleetId: '',
        capacity: '',
        serviceArea: '',
        accessibilityFeatures: ''
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        }

        if (!formData.fleetId.trim()) {
            newErrors.fleetId = 'Fleet ID is required';
        }

        if (!formData.capacity.trim()) {
            newErrors.capacity = 'Capacity is required';
        } else if (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
            newErrors.capacity = 'Capacity must be a positive number';
        }

        if (!formData.serviceArea.trim()) {
            newErrors.serviceArea = 'Service area is required';
        }

        if (!formData.accessibilityFeatures.trim()) {
            newErrors.accessibilityFeatures = 'Accessibility features are required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const response = await createDocument("vehicles", formData);

            if (response.ok) {
                toast.success('Vehicle created successfully!', {
                    description: `${formData.displayName} has been added to the fleet.`
                });

                // Reset form
                setFormData({
                    uuid: generateUUID(),
                    displayName: '',
                    fleetId: '',
                    capacity: '',
                    serviceArea: '',
                    accessibilityFeatures: ''
                });
                setErrors({});
            } else {
                const errorData = await response.json();
                toast.error('Failed to create vehicle', {
                    description: errorData.message || 'Please try again.'
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Error submitting form', {
                description: 'Please try again or contact support.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            uuid: generateUUID(),
            displayName: '',
            fleetId: '',
            capacity: '',
            serviceArea: '',
            accessibilityFeatures: ''
        });
        setErrors({});
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* UUID Field */}
                    <div className="space-y-2">
                        <Label htmlFor="uuid">
                            Vehicle UUID (Auto-generated)
                        </Label>
                        <Input
                            id="uuid"
                            name="uuid"
                            value={formData.uuid}
                            readOnly
                            disabled
                            className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">This UUID is automatically generated</p>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="displayName">
                            Display Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="displayName"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            placeholder="e.g., Van #1, Blue Sedan"
                            className={errors.displayName ? 'border-destructive' : ''}
                        />
                        {errors.displayName && (
                            <p className="text-sm text-destructive">{errors.displayName}</p>
                        )}
                    </div>

                    {/* Fleet ID */}
                    <div className="space-y-2">
                        <Label htmlFor="fleetId">
                            Fleet ID <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="fleetId"
                            name="fleetId"
                            value={formData.fleetId}
                            onChange={handleInputChange}
                            placeholder="Enter fleet identification number"
                            className={errors.fleetId ? 'border-destructive' : ''}
                        />
                        {errors.fleetId && (
                            <p className="text-sm text-destructive">{errors.fleetId}</p>
                        )}
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                        <Label htmlFor="capacity">
                            Capacity <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="capacity"
                            name="capacity"
                            type="number"
                            min="1"
                            value={formData.capacity}
                            onChange={handleInputChange}
                            placeholder="Number of passengers"
                            className={errors.capacity ? 'border-destructive' : ''}
                        />
                        {errors.capacity && (
                            <p className="text-sm text-destructive">{errors.capacity}</p>
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
                            name="serviceArea"
                            value={formData.serviceArea}
                            onChange={handleInputChange}
                            placeholder="e.g., Downtown, North County"
                            className={errors.serviceArea ? 'border-destructive' : ''}
                        />
                        {errors.serviceArea && (
                            <p className="text-sm text-destructive">{errors.serviceArea}</p>
                        )}
                    </div>

                    {/* Accessibility Features */}
                    <div className="space-y-2">
                        <Label htmlFor="accessibilityFeatures">
                            Accessibility Features <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="accessibilityFeatures"
                            name="accessibilityFeatures"
                            value={formData.accessibilityFeatures}
                            onChange={handleInputChange}
                            placeholder="e.g., Wheelchair accessible, Walker storage"
                            className={errors.accessibilityFeatures ? 'border-destructive' : ''}
                        />
                        {errors.accessibilityFeatures && (
                            <p className="text-sm text-destructive">{errors.accessibilityFeatures}</p>
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
                    disabled={submitting}
                >
                    Reset Form
                </Button>
                <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Creating...' : 'Create Vehicle'}
                </Button>
            </CardFooter>
        </Card>
    );
}
