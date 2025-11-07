import { useState, ChangeEvent, FormEvent } from 'react';
import {createDocument} from "../utils/database";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type {
  User,
  FormErrors,
  FormComponentProps,
  ServiceUserRole
} from "@/types";

// Generate a random UUID
const generateUUID = (): string => {
    return 'xxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const SERVICE_USER_ROLES: ServiceUserRole[] = ['rider', 'caregiver', 'relative', 'guardian', 'case manager', 'other'];

export default function UserForm({ setShowBaseForm, setShowUserForm }: FormComponentProps) {
    const [formData, setFormData] = useState<User>({
        uuid: generateUUID(),
        fullName: '',
        phone: '',
        dob: '',
        race: '',
        maritalStatus: '',
        residence: {
            current: '',
            last: ''
        },
        income: {
            current: '',
            last: ''
        },
        serviceUserRole: [],
        veteranStatus: '',
        disabilityStatus: ''
    });

    const [errors, setErrors] = useState<FormErrors<User>>({});
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string>('');

    const handleInputChange = (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: string; type?: string; checked?: boolean } }) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            // Type-safe handling of nested properties
            if (parent === 'residence' && (child === 'current' || child === 'last')) {
                setFormData(prev => ({
                    ...prev,
                    residence: {
                        ...prev.residence,
                        [child]: value
                    }
                }));
            } else if (parent === 'income' && (child === 'current' || child === 'last')) {
                setFormData(prev => ({
                    ...prev,
                    income: {
                        ...prev.income,
                        [child]: value
                    }
                }));
            }
        } else if (type === 'checkbox') {
            if (checked) {
                setFormData(prev => ({
                    ...prev,
                    serviceUserRole: [...prev.serviceUserRole, value as ServiceUserRole]
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    serviceUserRole: prev.serviceUserRole.filter(role => role !== value)
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (name: keyof User, value: string) => {
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
        const newErrors: FormErrors<User> = {};

        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.dob.trim()) newErrors.dob = 'Date of birth is required';
        if (!formData.race) newErrors.race = 'Race selection is required';
        if (!formData.maritalStatus) newErrors.maritalStatus = 'Marital status is required';
        if (!formData.residence.last.trim()) newErrors.residenceLast = 'Last residence is required';
        if (!formData.income.last.trim()) newErrors.incomeLast = 'Last income is required';
        if (formData.serviceUserRole.length === 0) newErrors.serviceUserRole = 'At least one service user role is required';

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
            const response = await createDocument("users", formData);

            if (response.ok) {
                setSubmitSuccess(true);
                toast.success('User created successfully!', {
                    description: `${formData.fullName} has been added to the system.`
                });

                // Reset form
                setFormData({
                    uuid: generateUUID(),
                    fullName: '',
                    phone: '',
                    dob: '',
                    race: '',
                    maritalStatus: '',
                    residence: { current: '', last: '' },
                    income: { current: '', last: '' },
                    serviceUserRole: [],
                    veteranStatus: '',
                    disabilityStatus: ''
                });
                setErrors({});
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Please try again.';
                setSubmitError(errorMessage);
                toast.error('Failed to create user', {
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
            phone: '',
            dob: '',
            race: '',
            maritalStatus: '',
            residence: { current: '', last: '' },
            income: { current: '', last: '' },
            serviceUserRole: [],
            veteranStatus: '',
            disabilityStatus: ''
        });
        setErrors({});
        setSubmitSuccess(false);
        setSubmitError('');
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>User Registration Form</CardTitle>
                <CardDescription>
                    Fill in the information to create a new user
                </CardDescription>
            </CardHeader>

            <CardContent>
                {submitSuccess && (
                    <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
                        <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                            User created successfully!
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
                            User UUID (Auto-generated)
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

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Phone Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Enter phone number"
                                className={errors.phone ? 'border-destructive' : ''}
                            />
                            {errors.phone && (
                                <p className="text-sm text-destructive">{errors.phone}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">
                                Date of Birth <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleInputChange}
                                className={errors.dob ? 'border-destructive' : ''}
                            />
                            {errors.dob && (
                                <p className="text-sm text-destructive">{errors.dob}</p>
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
                            <Select
                                value={formData.race}
                                onValueChange={(value) => handleSelectChange('race', value)}
                            >
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
                            {errors.race && (
                                <p className="text-sm text-destructive">{errors.race}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maritalStatus">
                                Marital Status <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.maritalStatus}
                                onValueChange={(value) => handleSelectChange('maritalStatus', value)}
                            >
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
                            {errors.maritalStatus && (
                                <p className="text-sm text-destructive">{errors.maritalStatus}</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Residence Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Residence Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="residence.current">
                                    Current Residence <span className="text-muted-foreground text-xs">(optional)</span>
                                </Label>
                                <Input
                                    id="residence.current"
                                    name="residence.current"
                                    value={formData.residence.current}
                                    onChange={handleInputChange}
                                    placeholder="Enter current residence"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="residence.last">
                                    Last Residence <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="residence.last"
                                    name="residence.last"
                                    value={formData.residence.last}
                                    onChange={handleInputChange}
                                    placeholder="Enter last residence"
                                    className={errors.residenceLast ? 'border-destructive' : ''}
                                />
                                {errors.residenceLast && (
                                    <p className="text-sm text-destructive">{errors.residenceLast}</p>
                                )}
                            </div>
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
                                    name="income.current"
                                    value={formData.income.current}
                                    onChange={handleInputChange}
                                    placeholder="Enter current income"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="income.last">
                                    Last Income <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="income.last"
                                    name="income.last"
                                    value={formData.income.last}
                                    onChange={handleInputChange}
                                    placeholder="Enter last income"
                                    className={errors.incomeLast ? 'border-destructive' : ''}
                                />
                                {errors.incomeLast && (
                                    <p className="text-sm text-destructive">{errors.incomeLast}</p>
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {SERVICE_USER_ROLES.map((role) => (
                                <label key={role} className="flex items-center space-x-2 cursor-pointer">
                                    <Checkbox
                                        id={`role-${role}`}
                                        name="serviceUserRole"
                                        value={role}
                                        checked={formData.serviceUserRole.includes(role)}
                                        onCheckedChange={(checked) => {
                                            handleInputChange({
                                                target: {
                                                    name: 'serviceUserRole',
                                                    value: role,
                                                    type: 'checkbox',
                                                    checked: checked as boolean
                                                }
                                            });
                                        }}
                                    />
                                    <Label htmlFor={`role-${role}`} className="capitalize font-normal cursor-pointer">
                                        {role}
                                    </Label>
                                </label>
                            ))}
                        </div>
                        {errors.serviceUserRole && (
                            <p className="text-sm text-destructive">{errors.serviceUserRole}</p>
                        )}
                    </div>

                    <Separator />

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="veteranStatus">
                                Veteran Status <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <Select
                                value={formData.veteranStatus}
                                onValueChange={(value) => handleSelectChange('veteranStatus', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select veteran status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="veteran">Veteran</SelectItem>
                                    <SelectItem value="not veteran">Not Veteran</SelectItem>
                                    <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="disabilityStatus">
                                Disability Status <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <Select
                                value={formData.disabilityStatus}
                                onValueChange={(value) => handleSelectChange('disabilityStatus', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select disability status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                    <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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
                        {submitting ? 'Creating...' : 'Create User'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
