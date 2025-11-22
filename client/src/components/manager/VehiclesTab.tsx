import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getApiUrl, useVehicles } from '@/lib/api';
import { TableSkeleton } from './TableSkeleton';
import { VehicleEditModal } from './VehicleEditModal';

interface VehiclesTabProps {
  searchTerm: string;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

// API response type - matches what the backend returns
interface Vehicle {
  uuid: string;
  displayName: string;
  fleetId?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  capacity?: number;
  serviceArea?: string;
  wheelchairAccessible: boolean;
  walkerAccessible: boolean;
  serviceAnimalFriendly: boolean;
  oxygenTankAccessible: boolean;
}

// Helper function to format accessibility features
function formatAccessibilityFeatures(vehicle: Vehicle): string {
  const features: string[] = [];

  if (vehicle.wheelchairAccessible) features.push('Wheelchair');
  if (vehicle.walkerAccessible) features.push('Walker');
  if (vehicle.serviceAnimalFriendly) features.push('Service Animal');
  if (vehicle.oxygenTankAccessible) features.push('Oxygen Tank');

  return features.length > 0 ? features.join(', ') : 'None';
}

export function VehiclesTab({ searchTerm }: VehiclesTabProps) {
  const navigate = useNavigate();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { data: vehiclesData, isLoading, refetch } = useVehicles();

  const vehicles: Vehicle[] =
    (vehiclesData as { vehicles?: Vehicle[] })?.vehicles ||
    (Array.isArray(vehiclesData) ? vehiclesData : []);

  const handleDeleteVehicle = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/vehicles/${uuid}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Vehicle deleted successfully');
        refetch();
      } else {
        toast.error(data.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.fleetId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.serviceArea?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {editingVehicle && (
        <VehicleEditModal
          vehicle={editingVehicle}
          open={!!editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehicles</CardTitle>
              <CardDescription>View and manage all vehicles in the fleet</CardDescription>
            </div>
            <Button onClick={() => navigate('/vehicle')}>Add Vehicle</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filteredVehicles.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No vehicles found</p>
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
                {filteredVehicles.map((vehicle) => {
                  const accessibilityText = formatAccessibilityFeatures(vehicle);
                  return (
                    <TableRow key={vehicle.uuid}>
                      <TableCell>{vehicle.displayName || 'N/A'}</TableCell>
                      <TableCell>{vehicle.fleetId || 'N/A'}</TableCell>
                      <TableCell>{vehicle.capacity || 0} passengers</TableCell>
                      <TableCell>{vehicle.serviceArea || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={accessibilityText !== 'None' ? 'default' : 'secondary'}>
                          {accessibilityText}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVehicle(vehicle)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVehicle(vehicle.uuid)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
