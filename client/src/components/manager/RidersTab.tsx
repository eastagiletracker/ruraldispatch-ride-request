import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { getApiUrl, useUsers } from '@/lib/api';
import { formatShortId } from '@/utils/formatters';
import { RiderAddModal } from './RiderAddModal';
import { RiderEditModal } from './RiderEditModal';
import { TableSkeleton } from './TableSkeleton';

interface RidersTabProps {
  searchTerm: string;
  onUpdate?: () => {
    refetch: () => Promise<unknown>;
  };
}

// API response type - matches what the backend returns
interface User {
  uuid: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  smsConsentGiven?: boolean;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

export function RidersTab({ searchTerm }: RidersTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRider, setEditingRider] = useState<User | null>(null);
  const { data: usersData, isLoading, refetch } = useUsers();

  const riders: User[] =
    (usersData as { users?: User[] })?.users || (Array.isArray(usersData) ? usersData : []);

  const handleDeleteRider = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this rider?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/users/${uuid}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Rider deleted successfully');
        refetch();
      } else {
        toast.error(data.message || 'Failed to delete rider');
      }
    } catch (error) {
      console.error('Error deleting rider:', error);
      toast.error('Failed to delete rider');
    }
  };

  const filteredRiders = riders.filter(
    (rider) =>
      rider.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.phone?.includes(searchTerm)
  );

  return (
    <>
      <RiderAddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {editingRider && (
        <RiderEditModal
          rider={editingRider}
          open={!!editingRider}
          onClose={() => setEditingRider(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Riders</CardTitle>
              <CardDescription>View and manage all riders in the system</CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)}>Add Rider</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filteredRiders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No riders found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>SMS Consent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiders.map((rider) => (
                  <TableRow key={rider.uuid}>
                    <TableCell className="font-medium">{formatShortId(rider.uuid)}</TableCell>
                    <TableCell>{rider.fullName || 'N/A'}</TableCell>
                    <TableCell>{rider.phone || 'N/A'}</TableCell>
                    <TableCell>{rider.email || 'N/A'}</TableCell>
                    <TableCell>{rider.address || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={rider.smsConsentGiven ? 'text-green-600' : 'text-red-600'}>
                        {rider.smsConsentGiven ? '✓ Yes' : '✗ No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingRider(rider)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRider(rider.uuid)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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
    </>
  );
}
