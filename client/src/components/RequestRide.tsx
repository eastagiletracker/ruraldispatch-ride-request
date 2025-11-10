import { useState } from 'react';
import UserForm from './UserForm';
import UserSearch from './UserSearch';
import RideRequestForm from './RideRequestForm';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search } from "lucide-react";
import type { User } from "@/types";

export default function RequestRide() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showBaseForm, setShowBaseForm] = useState<boolean>(true);
    const [showRideRequestForm, setShowRideRequestForm] = useState<boolean>(false);
    const [showUserForm, setShowUserForm] = useState<boolean>(false);
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);

    async function handleUserSelect(user: User) {
        setIsLoadingUser(true);
        try {
            // Use the user data we already have from the search
            // No need to fetch again since UserSearch already provides complete user info
            setSelectedUser(user);
            console.log('Selected user:', user);
        } catch (error) {
            console.error('Error selecting user:', error);
        } finally {
            setIsLoadingUser(false);
        }
    }

    return (
        <div className='flex flex-col gap-6 w-full justify-center items-center max-w-4xl mx-auto'>
            {showBaseForm && (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Add a User
                        </CardTitle>
                        <CardDescription>
                            Add a new user or find an existing user
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Button
                            onClick={() => {
                                setShowBaseForm(false);
                                setShowUserForm(true);
                            }}
                            className="w-full md:w-auto"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add a User
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">OR</span>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <h3 className='text-lg font-semibold flex items-center gap-2'>
                                    <Search className="h-5 w-5 text-primary" />
                                    Create Ride Request
                                </h3>
                                <p className='text-sm text-muted-foreground mt-1'>
                                    Find an existing user to start a Ride Request
                                </p>
                            </div>
                            <UserSearch onUserSelect={handleUserSelect} />
                        </div>

                        {selectedUser && (
                            <div className='space-y-3 pt-4 border-t'>
                                <div className='bg-muted p-3 rounded-md'>
                                    <p className='text-sm font-medium'>Selected User: {selectedUser.fullName}</p>
                                    <p className='text-xs text-muted-foreground'>UUID: {selectedUser.uuid}</p>
                                </div>
                                <div className='flex flex-col sm:flex-row gap-3'>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedUser(null);
                                        }}
                                        className="flex-1"
                                    >
                                        Clear Selection
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            console.log('Request Ride button clicked');
                                            setShowRideRequestForm(true);
                                            setShowBaseForm(false);
                                            setShowUserForm(false);
                                            console.log('State updated - showRideRequestForm:', true);
                                        }}
                                        className="flex-1"
                                    >
                                        Request Ride
                                    </Button>
                                </div>
                            </div>
                        )}
                        {isLoadingUser && (
                            <div className='flex items-center justify-center py-4'>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className='ml-2 text-sm text-muted-foreground'>Loading user...</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            {showUserForm && <UserForm setShowBaseForm={setShowBaseForm} setShowUserForm={setShowUserForm} />}
            {showRideRequestForm && selectedUser && <RideRequestForm selectedUser={selectedUser} setShowRideRequestForm={setShowRideRequestForm} setShowBaseForm={setShowBaseForm} setShowUserForm={setShowUserForm} />}
        </div>
    );
}
