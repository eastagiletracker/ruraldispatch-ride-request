import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Trash2, Search, AlertCircle, Briefcase, Truck, Clipboard } from "lucide-react";
import { toast } from 'sonner';
import StatusToggleButton from "@/components/StatusToggleButton";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to get headers with user role
const getAuthHeaders = () => {
    const userRole = sessionStorage.getItem('user_role');
    return {
        'Content-Type': 'application/json',
        'x-user-role': userRole || ''
    };
};

interface Rider {
    uuid: number;
    fullName: string;
    phone: string;
    email?: string;
    address?: string;
}

interface ServiceProvider {
    uuid: number;
    fullName: string;
    title?: string;
    organization?: string;
    mobilePhone?: string;
    serviceProviderRole?: string;
    specializations?: string;
}

interface Vehicle {
    uuid: number;
    displayName: string;
    fleetId: string;
    capacity: number;
    serviceArea: string;
    accessibilityFeatures: string;
}

interface CaseManager {
    uuid: number;
    username: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    isActive: boolean;
}

interface Dispatcher {
    uuid: number;
    username: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    isActive: boolean;
}

export default function Manager() {
    const [activeTab, setActiveTab] = useState('riders');
    const [riders, setRiders] = useState<Rider[]>([]);
    const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
    const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: 0, itemName: '', type: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Loading states for individual actions
    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

    // Fetch data on tab change
    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'riders':
                    await fetchRiders();
                    break;
                case 'providers':
                    await fetchServiceProviders();
                    break;
                case 'vehicles':
                    await fetchVehicles();
                    break;
                case 'case-managers':
                    await fetchCaseManagers();
                    break;
                case 'dispatchers':
                    await fetchDispatchers();
                    break;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchRiders = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setRiders(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching riders:', error);
        }
    };

    const fetchServiceProviders = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/service-providers`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setServiceProviders(data.serviceProviders || []);
            }
        } catch (error) {
            console.error('Error fetching service providers:', error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/vehicles`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setVehicles(data.vehicles || []);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };


    const fetchCaseManagers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/system-users?role=case_manager`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setCaseManagers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching case managers:', error);
        }
    };

    const fetchDispatchers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/system-users?role=dispatcher`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setDispatchers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching dispatchers:', error);
        }
    };

    const handleDeleteRider = async (uuid: number) => {
        if (!confirm('Are you sure you want to delete this rider?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/${uuid}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Rider deleted successfully');
                fetchRiders();
            } else {
                toast.error(data.message || 'Failed to delete rider');
            }
        } catch (error) {
            console.error('Error deleting rider:', error);
            toast.error('Failed to delete rider');
        }
    };

    const handleDeleteServiceProvider = async (uuid: number) => {
        if (!confirm('Are you sure you want to delete this service provider?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/service-providers/${uuid}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Service provider deleted successfully');
                fetchServiceProviders();
            } else {
                toast.error(data.message || 'Failed to delete service provider');
            }
        } catch (error) {
            console.error('Error deleting service provider:', error);
            toast.error('Failed to delete service provider');
        }
    };

    const handleDeleteVehicle = async (uuid: number) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/vehicles/${uuid}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Vehicle deleted successfully');
                fetchVehicles();
            } else {
                toast.error(data.message || 'Failed to delete vehicle');
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            toast.error('Failed to delete vehicle');
        }
    };

    const handleDeleteCaseManager = async (uuid: number, name: string) => {
        setDeleteModal({ isOpen: true, itemId: uuid, itemName: name, type: 'case-manager' });
    };

    const performDeleteCaseManager = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/system-users/${deleteModal.itemId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Case manager deleted successfully');
                setDeleteModal({ isOpen: false, itemId: 0, itemName: '', type: '' });
                fetchCaseManagers();
            } else {
                toast.error(data.message || 'Failed to delete case manager');
            }
        } catch (error) {
            console.error('Error deleting case manager:', error);
            toast.error('Failed to delete case manager');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleCaseManagerStatus = async (uuid: number, currentStatus: boolean) => {
        const actionKey = `casemanager-toggle-${uuid}`;
        setLoadingActions(prev => ({ ...prev, [actionKey]: true }));

        try {
            const response = await fetch(`${API_BASE_URL}/auth/system-users/${uuid}/toggle-status`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Case manager ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
                fetchCaseManagers();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating case manager status:', error);
            toast.error('Failed to update status');
        } finally {
            setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
        }
    };

    const handleDeleteDispatcher = async (uuid: number, name: string) => {
        setDeleteModal({ isOpen: true, itemId: uuid, itemName: name, type: 'dispatcher' });
    };

    const performDeleteDispatcher = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/system-users/${deleteModal.itemId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Dispatcher deleted successfully');
                setDeleteModal({ isOpen: false, itemId: 0, itemName: '', type: '' });
                fetchDispatchers();
            } else {
                toast.error(data.message || 'Failed to delete dispatcher');
            }
        } catch (error) {
            console.error('Error deleting dispatcher:', error);
            toast.error('Failed to delete dispatcher');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleDispatcherStatus = async (uuid: number, currentStatus: boolean) => {
        const actionKey = `dispatcher-toggle-${uuid}`;
        setLoadingActions(prev => ({ ...prev, [actionKey]: true }));

        try {
            const response = await fetch(`${API_BASE_URL}/auth/system-users/${uuid}/toggle-status`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Dispatcher ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
                fetchDispatchers();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating dispatcher status:', error);
            toast.error('Failed to update status');
        } finally {
            setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
        }
    };


    // Filter data based on search term
    const filteredRiders = riders.filter(rider =>
        rider.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.phone?.includes(searchTerm)
    );

    const filteredProviders = serviceProviders.filter(provider =>
        provider.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.mobilePhone?.includes(searchTerm)
    );

    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.fleetId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.serviceArea?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCaseManagers = caseManagers.filter(manager =>
        manager.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDispatchers = dispatchers.filter(dispatcher =>
        dispatcher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatcher.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatcher.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">System Manager</h1>
                <p className="text-muted-foreground">Manage riders, drivers/staff (assignable to rides), vehicles, dispatchers, and case managers</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="riders" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Riders
                </TabsTrigger>
                <TabsTrigger value="providers" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Providers
                </TabsTrigger>
                <TabsTrigger value="vehicles" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vehicles
                </TabsTrigger>
                <TabsTrigger value="dispatchers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Dispatchers
                </TabsTrigger>
                <TabsTrigger value="case-managers" className="flex items-center gap-2">
                    <Clipboard className="h-4 w-4" />
                    Case Managers
                </TabsTrigger>
            </TabsList>                {/* Search Bar */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={fetchData}>
                        Refresh
                    </Button>
                </div>

                {/* Riders Tab */}
                <TabsContent value="riders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Riders</CardTitle>
                                    <CardDescription>View and manage all riders in the system</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-center py-8 text-muted-foreground">Loading...</p>
                            ) : filteredRiders.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No riders found</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRiders.map((rider) => (
                                            <TableRow key={rider.uuid}>
                                                <TableCell className="font-medium">{rider.uuid}</TableCell>
                                                <TableCell>{rider.fullName || 'N/A'}</TableCell>
                                                <TableCell>{rider.phone || 'N/A'}</TableCell>
                                                <TableCell>{rider.email || 'N/A'}</TableCell>
                                                <TableCell>{rider.address || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteRider(rider.uuid)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Service Providers Tab */}
                <TabsContent value="providers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Service Providers (Staff/Drivers)</CardTitle>
                                    <CardDescription>View and manage drivers, case workers, and staff members who can be assigned to rides</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-center py-8 text-muted-foreground">Loading...</p>
                            ) : filteredProviders.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No service providers found</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Organization</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProviders.map((provider) => (
                                            <TableRow key={provider.uuid}>
                                                <TableCell className="font-medium">{provider.uuid}</TableCell>
                                                <TableCell className="font-semibold">{provider.fullName || 'N/A'}</TableCell>
                                                <TableCell>{provider.title || 'N/A'}</TableCell>
                                                <TableCell>{provider.organization || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{provider.serviceProviderRole || 'N/A'}</Badge>
                                                </TableCell>
                                                <TableCell>{provider.mobilePhone || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteServiceProvider(provider.uuid)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vehicles Tab */}
                <TabsContent value="vehicles" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Vehicles</CardTitle>
                                    <CardDescription>View and manage all vehicles in the fleet</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-center py-8 text-muted-foreground">Loading...</p>
                            ) : filteredVehicles.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No vehicles found</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Display Name</TableHead>
                                            <TableHead>Fleet ID</TableHead>
                                            <TableHead>Capacity</TableHead>
                                            <TableHead>Service Area</TableHead>
                                            <TableHead>Accessibility</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredVehicles.map((vehicle) => (
                                            <TableRow key={vehicle.uuid}>
                                                <TableCell className="font-medium">{vehicle.displayName || 'N/A'}</TableCell>
                                                <TableCell className="font-mono">{vehicle.fleetId || 'N/A'}</TableCell>
                                                <TableCell>{vehicle.capacity || 0} passengers</TableCell>
                                                <TableCell>{vehicle.serviceArea || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={vehicle.accessibilityFeatures !== 'None' ? 'default' : 'secondary'}>
                                                        {vehicle.accessibilityFeatures || 'None'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteVehicle(vehicle.uuid)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Dispatchers Tab */}
                <TabsContent value="dispatchers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Dispatchers</CardTitle>
                                    <CardDescription>Manage dispatcher accounts who can assign rides and manage operations</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Dispatchers can view all rides, assign drivers/vehicles, but cannot access System Manager or delete data.
                                </AlertDescription>
                            </Alert>
                            {loading ? (
                                <p className="text-center py-8 text-muted-foreground">Loading...</p>
                            ) : filteredDispatchers.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No dispatchers found</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDispatchers.map((dispatcher) => (
                                            <TableRow key={dispatcher.uuid}>
                                                <TableCell className="font-medium">{dispatcher.uuid}</TableCell>
                                                <TableCell className="font-mono">{dispatcher.username}</TableCell>
                                                <TableCell>{dispatcher.fullName || 'N/A'}</TableCell>
                                                <TableCell>{dispatcher.email || 'N/A'}</TableCell>
                                                <TableCell>{dispatcher.phone || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={dispatcher.isActive ? "default" : "secondary"}>
                                                        {dispatcher.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <StatusToggleButton
                                                            isActive={dispatcher.isActive}
                                                            isLoading={loadingActions[`dispatcher-toggle-${dispatcher.uuid}`] || false}
                                                            onClick={() => handleToggleDispatcherStatus(dispatcher.uuid, dispatcher.isActive)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteDispatcher(dispatcher.uuid, dispatcher.fullName)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Case Managers Tab */}
                <TabsContent value="case-managers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Case Managers</CardTitle>
                                    <CardDescription>Add, edit, and manage case manager accounts</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Case managers can submit ride requests and have limited system access.
                                </AlertDescription>
                            </Alert>
                            {loading ? (
                                <p className="text-center py-8 text-muted-foreground">Loading...</p>
                            ) : filteredCaseManagers.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No case managers found</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCaseManagers.map((manager) => (
                                            <TableRow key={manager.uuid}>
                                                <TableCell className="font-medium">{manager.uuid}</TableCell>
                                                <TableCell className="font-mono">{manager.username}</TableCell>
                                                <TableCell>{manager.fullName || 'N/A'}</TableCell>
                                                <TableCell>{manager.email || 'N/A'}</TableCell>
                                                <TableCell>{manager.phone || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={manager.isActive ? "default" : "secondary"}>
                                                        {manager.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <StatusToggleButton
                                                            isActive={manager.isActive}
                                                            isLoading={loadingActions[`casemanager-toggle-${manager.uuid}`] || false}
                                                            onClick={() => handleToggleCaseManagerStatus(manager.uuid, manager.isActive)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteCaseManager(manager.uuid, manager.fullName)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, itemId: 0, itemName: '', type: '' })}
                onConfirm={deleteModal.type === 'dispatcher' ? performDeleteDispatcher : performDeleteCaseManager}
                title={`Delete ${deleteModal.type === 'dispatcher' ? 'Dispatcher' : 'Case Manager'}`}
                description={`Are you sure you want to delete ${deleteModal.itemName}? This action cannot be undone.`}
                isLoading={isDeleting}
            />
        </div>
    );
}
