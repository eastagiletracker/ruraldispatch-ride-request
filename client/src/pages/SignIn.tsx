import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, AlertCircle } from "lucide-react";
import { signInSchema, type SignInFormData } from "@/schemas/validation";
import { isPortalAuthValid } from '@/utils/permissions';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function SignIn() {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    
    // Sync and validate app_authenticated from localStorage to sessionStorage on mount
    useEffect(() => {
        if (isPortalAuthValid()) {
            // If valid, ensure both storages have the current valid auth data
            const localAuth = localStorage.getItem('app_authenticated');
            if (localAuth) {
                sessionStorage.setItem('app_authenticated', localAuth);
            }
        } else {
            // If expired or invalid, redirect to portal access
            navigate('/portal-access');
        }
    }, [navigate]);
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema)
    });

    const onSubmit = async (formData: SignInFormData) => {
        setServerError('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success && data.user) {
                // Store user authentication and role info
                sessionStorage.setItem('user_authenticated', 'true');
                sessionStorage.setItem('username', data.user.username);
                sessionStorage.setItem('user_role', data.user.role);
                sessionStorage.setItem('user_fullname', data.user.fullName);
                sessionStorage.setItem('user_uuid', data.user.uuid.toString());

                // Role-based redirect
                const roleRedirects = {
                    'admin': '/dashboard',
                    'dispatcher': '/dispatcher-hub',
                    'driver': '/my-rides',
                    'case_manager': '/ride-request'
                };

                const redirectPath = roleRedirects[data.user.role as keyof typeof roleRedirects] || '/ride-request';
                navigate(redirectPath);
            } else {
                setServerError(data.message || 'Invalid username or password. Please try again.');
                reset({ password: '' });
            }
        } catch (error) {
            console.error('Login error:', error);
            setServerError('Unable to connect to server. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <User className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Sign In</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {serverError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                {...register('username')}
                                placeholder="Enter username"
                                autoFocus
                            />
                            {errors.username && (
                                <p className="text-sm text-destructive">{errors.username.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register('password')}
                                placeholder="Enter password"
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
