import { AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import StatusToggleButton from '@/components/StatusToggleButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { getApiUrl, useSystemUsers } from '@/lib/api';
import { formatShortId } from '@/utils/formatters';
import { SystemUserAddModal } from './SystemUserAddModal';
import { SystemUserEditModal } from './SystemUserEditModal';
import { TableSkeleton } from './TableSkeleton';

interface DispatchersTabProps {
  searchTerm: string;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

import type { SystemUser } from '@shared/schemas';

export function DispatchersTab({ searchTerm }: DispatchersTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: '', itemName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const { data: dispatchersData, isLoading, refetch } = useSystemUsers();

  const allSystemUsers: SystemUser[] =
    (dispatchersData as { users?: SystemUser[] })?.users ||
    (Array.isArray(dispatchersData) ? dispatchersData : []);
  const dispatchers = allSystemUsers.filter((u) => u.role === 'dispatcher');

  const handleDeleteDispatcher = async (uuid: string, name: string) => {
    setDeleteModal({ isOpen: true, itemId: uuid, itemName: name });
  };

  const performDeleteDispatcher = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/auth/system-users/${deleteModal.itemId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Dispatcher deleted successfully');
        setDeleteModal({ isOpen: false, itemId: '', itemName: '' });
        refetch();
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

  const handleToggleDispatcherStatus = async (uuid: string, currentStatus: boolean) => {
    const actionKey = `dispatcher-toggle-${uuid}`;
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(getApiUrl(`/api/auth/system-users/${uuid}/toggle-status`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Dispatcher ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        refetch();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating dispatcher status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const filteredDispatchers = dispatchers.filter(
    (dispatcher) =>
      dispatcher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatcher.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispatcher.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SystemUserAddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch();
        }}
        userType="dispatcher"
      />

      {editingUser && (
        <SystemUserEditModal
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dispatchers</CardTitle>
              <CardDescription>
                Manage dispatcher accounts who can assign rides and manage operations
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)}>Add Dispatcher</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Dispatchers can view all rides, assign drivers/vehicles, but cannot access System
              Manager or delete data.
            </AlertDescription>
          </Alert>
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filteredDispatchers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No dispatchers found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatchers.map((dispatcher) => (
                  <TableRow key={dispatcher.uuid}>
                    <TableCell className="font-medium">{formatShortId(dispatcher.uuid)}</TableCell>
                    <TableCell className="font-mono">{dispatcher.username}</TableCell>
                    <TableCell>{dispatcher.fullName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={dispatcher.isActive ? 'default' : 'secondary'}>
                        {dispatcher.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(dispatcher)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <StatusToggleButton
                          isActive={dispatcher.isActive}
                          isLoading={
                            loadingActions[`dispatcher-toggle-${dispatcher.uuid}`] || false
                          }
                          onClick={() =>
                            handleToggleDispatcherStatus(dispatcher.uuid, dispatcher.isActive)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteDispatcher(dispatcher.uuid, dispatcher.fullName)
                          }
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemId: '', itemName: '' })}
        onConfirm={performDeleteDispatcher}
        title="Delete Dispatcher"
        description={`Are you sure you want to delete ${deleteModal.itemName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
