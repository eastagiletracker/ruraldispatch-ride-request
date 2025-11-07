import { useState, ChangeEvent, FormEvent } from 'react';
import { createDocument } from "../utils/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ServiceProvider, FormErrors, Organization, ServiceProviderRole, Specialization } from "@/types";

const ORGANIZATIONS: Organization[] = ['EASTCONN', 'Generations Health'];

const SERVICE_PROVIDER_ROLES: ServiceProviderRole[] = [
    'Transport Broker',
    'Staff',
    'Fleet Manager',
    'Driver',
    'Admin'
];

const SPECIALIZATIONS: Specialization[] = [
    'Caseworker',
    'Nutritionist',
    'Intake'
];

const generateUUID = (): string => {
    return 'xxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export default function CreateProvider() {
    const [formData, setFormData] = useState<ServiceProvider>({
        uuid: generateUUID(),
        fullName: '',
        title: '',
        organization: '',
        mobilePhone: '',
        serviceProviderRole: '',
        specializations: '',
        faxPhone: ''
    });

    const [errors, setErrors] = useState<FormErrors<ServiceProvider>>({});
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string>('');

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name as keyof ServiceProvider]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (name: keyof ServiceProvider, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user selects
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors<ServiceProvider> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.organization) {
            newErrors.organization = 'Organization is required';
        }

        if (!formData.mobilePhone.trim()) {
            newErrors.mobilePhone = 'Mobile phone is required';
        }

        if (!formData.serviceProviderRole) {
            newErrors.serviceProviderRole = 'Service provider role is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess(false);
        
        try {
            const response = await createDocument("providers", formData);

            if (response.ok) {
                setSubmitSuccess(true);
                toast.success('Service provider created successfully!', {
                    description: `${formData.fullName} has been added to the system.`
                });

                // Reset form
                setFormData({
                    uuid: generateUUID(),
                    fullName: '',
                    title: '',
                    organization: '',
                    mobilePhone: '',
                    serviceProviderRole: '',
                    specializations: '',
                    faxPhone: ''
                });
                setErrors({});
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Please try again.';
                setSubmitError(errorMessage);
                toast.error('Failed to create service provider', {
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
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            uuid: generateUUID(),
            fullName: '',
            title: '',
            organization: '',
            mobilePhone: '',
            serviceProviderRole: '',
            specializations: '',
            faxPhone: ''
        });
        setErrors({});
        setSubmitSuccess(false);
        setSubmitError('');
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create Service Provider</CardTitle>
                <CardDescription>
                    Fill in the information to create a new service provider
                </CardDescription>
            </CardHeader>

            <CardContent>
                {submitSuccess && (
                    <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
                        <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                            Service provider created successfully!
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

                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    {/* UUID Field */}
                    <div className="space-y-2">
                        <Label htmlFor="uuid">
                            Service Provider UUID (Auto-generated)
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

                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName">
                            Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Enter full name"
                            className={errors.fullName ? 'border-destructive' : ''}
                        />
                        {errors.fullName && (
                            <p className="text-sm text-destructive">{errors.fullName}</p>
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Enter title"
                            className={errors.title ? 'border-destructive' : ''}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title}</p>
                        )}
                    </div>

                    {/* Organization */}
                    <div className="space-y-2">
                        <Label htmlFor="organization">
                            Organization <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.organization}
                            onValueChange={(value) => handleSelectChange('organization', value)}
                        >
                            <SelectTrigger className={errors.organization ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORGANIZATIONS.map(org => (
                                    <SelectItem key={org} value={org}>{org}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.organization && (
                            <p className="text-sm text-destructive">{errors.organization}</p>
                        )}
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="mobilePhone">
                            Mobile Phone <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="mobilePhone"
                            name="mobilePhone"
                            type="tel"
                            value={formData.mobilePhone}
                            onChange={handleInputChange}
                            placeholder="Enter mobile phone number"
                            className={errors.mobilePhone ? 'border-destructive' : ''}
                        />
                        {errors.mobilePhone && (
                            <p className="text-sm text-destructive">{errors.mobilePhone}</p>
                        )}
                    </div>

                    {/* Service Provider Role */}
                    <div className="space-y-2">
                        <Label htmlFor="serviceProviderRole">
                            Service Provider Role <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.serviceProviderRole}
                            onValueChange={(value) => handleSelectChange('serviceProviderRole', value)}
                        >
                            <SelectTrigger className={errors.serviceProviderRole ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {SERVICE_PROVIDER_ROLES.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.serviceProviderRole && (
                            <p className="text-sm text-destructive">{errors.serviceProviderRole}</p>
                        )}
                    </div>

                    {/* Specializations - Only show if Staff role selected */}
                    {formData.serviceProviderRole === 'Staff' && (
                        <div className="space-y-2">
                            <Label htmlFor="specializations">
                                Specializations
                            </Label>
                            <Select
                                value={formData.specializations}
                                onValueChange={(value) => handleSelectChange('specializations', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SPECIALIZATIONS.map(specialization => (
                                        <SelectItem key={specialization} value={specialization}>
                                            {specialization}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Fax Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="faxPhone">
                            Fax Phone <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Input
                            id="faxPhone"
                            name="faxPhone"
                            type="tel"
                            value={formData.faxPhone}
                            onChange={handleInputChange}
                            placeholder="Enter fax phone number (optional)"
                        />
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
                    {submitting ? 'Creating...' : 'Create Service Provider'}
                </Button>
            </CardFooter>
        </Card>
    );
}
