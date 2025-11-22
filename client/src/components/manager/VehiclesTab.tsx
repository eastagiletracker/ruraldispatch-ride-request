import { Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import VehicleForm from '@/components/VehicleForm';
import { getApiUrl, useVehicles } from '@/lib/api';
import { formatShortId } from '@/utils/formatters';
import { TableSkeleton } from './TableSkeleton';

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

export function VehiclesTab({ searchTerm }: VehiclesTabProps) {
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const { data: vehiclesData, isLoading, refetch } = useVehicles();

  const vehicles =
    (vehiclesData as any)?.vehicles || (Array.isArray(vehiclesData) ? vehiclesData : []);

  const handleDeleteVehicle = async (uuid: number) => {
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
      {showVehicleForm && (
        <VehicleForm
          onSuccess={() => {
            setShowVehicleForm(false);
            refetch();
          }}
          onCancel={() => setShowVehicleForm(false)}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehicles</CardTitle>
              <CardDescription>View and manage all vehicles in the fleet</CardDescription>
            </div>
            <Button onClick={() => setShowVehicleForm(!showVehicleForm)}>
              {showVehicleForm ? 'Hide Form' : 'Add Vehicle'}
            </Button>
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
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.uuid}>
                    <TableCell>{vehicle.displayName || 'N/A'}</TableCell>
                    <TableCell>{vehicle.fleetId || 'N/A'}</TableCell>
                    <TableCell>{vehicle.capacity || 0} passengers</TableCell>
                    <TableCell>{vehicle.serviceArea || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={vehicle.accessibilityFeatures !== 'None' ? 'default' : 'secondary'}
                      >
                        {vehicle.accessibilityFeatures || 'None'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.uuid)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
