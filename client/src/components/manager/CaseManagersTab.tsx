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

interface CaseManagersTabProps {
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

export function CaseManagersTab({ searchTerm }: CaseManagersTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: '', itemName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const { data: caseManagersData, isLoading, refetch } = useSystemUsers();

  const allSystemUsers: SystemUser[] =
    (caseManagersData as { users?: SystemUser[] })?.users ||
    (Array.isArray(caseManagersData) ? caseManagersData : []);
  const caseManagers = allSystemUsers.filter((u) => u.role === 'case_manager');

  const handleDeleteCaseManager = async (uuid: string, name: string) => {
    setDeleteModal({ isOpen: true, itemId: uuid, itemName: name });
  };

  const performDeleteCaseManager = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/auth/system-users/${deleteModal.itemId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Case manager deleted successfully');
        setDeleteModal({ isOpen: false, itemId: '', itemName: '' });
        refetch();
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

  const handleToggleCaseManagerStatus = async (uuid: string, currentStatus: boolean) => {
    const actionKey = `casemanager-toggle-${uuid}`;
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(getApiUrl(`/api/auth/system-users/${uuid}/toggle-status`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Case manager ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        refetch();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating case manager status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const filteredCaseManagers = caseManagers.filter(
    (manager) =>
      manager.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SystemUserAddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch();
        }}
        userType="case_manager"
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
              <CardTitle>Case Managers</CardTitle>
              <CardDescription>Add, edit, and manage case manager accounts</CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)}>Add Case Manager</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Case managers can submit ride requests and have limited system access.
            </AlertDescription>
          </Alert>
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filteredCaseManagers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No case managers found</p>
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
                {filteredCaseManagers.map((manager) => (
                  <TableRow key={manager.uuid}>
                    <TableCell className="font-medium">{formatShortId(manager.uuid)}</TableCell>
                    <TableCell className="font-mono">{manager.username}</TableCell>
                    <TableCell>{manager.fullName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={manager.isActive ? 'default' : 'secondary'}>
                        {manager.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingUser(manager)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <StatusToggleButton
                          isActive={manager.isActive}
                          isLoading={loadingActions[`casemanager-toggle-${manager.uuid}`] || false}
                          onClick={() =>
                            handleToggleCaseManagerStatus(manager.uuid, manager.isActive)
                          }
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemId: '', itemName: '' })}
        onConfirm={performDeleteCaseManager}
        title="Delete Case Manager"
        description={`Are you sure you want to delete ${deleteModal.itemName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
