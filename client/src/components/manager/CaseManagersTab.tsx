import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash2 } from "lucide-react";
import { toast } from 'sonner';
import StatusToggleButton from "@/components/StatusToggleButton";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { formatShortId } from "@/utils/formatters";
import { useSystemUsers, getApiUrl } from '@/lib/api';
import { TableSkeleton } from './TableSkeleton';

interface CaseManagersTabProps {
  searchTerm: string;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || ''
  };
}

export function CaseManagersTab({ searchTerm }: CaseManagersTabProps) {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: 0, itemName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const { data: caseManagersData, isLoading, refetch } = useSystemUsers();

  const allSystemUsers = (caseManagersData as any)?.users || (Array.isArray(caseManagersData) ? caseManagersData : []);
  const caseManagers = allSystemUsers.filter((u: any) => u.role === 'case_manager');

  const handleDeleteCaseManager = async (uuid: number, name: string) => {
    setDeleteModal({ isOpen: true, itemId: uuid, itemName: name });
  };

  const performDeleteCaseManager = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/auth/system-users/${deleteModal.itemId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Case manager deleted successfully');
        setDeleteModal({ isOpen: false, itemId: 0, itemName: '' });
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

  const handleToggleCaseManagerStatus = async (uuid: number, currentStatus: boolean) => {
    const actionKey = `casemanager-toggle-${uuid}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));

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
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const filteredCaseManagers = caseManagers.filter(manager =>
    manager.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
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
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Case managers can submit ride requests and have limited system access.
            </AlertDescription>
          </Alert>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filteredCaseManagers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No case managers found</p>
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
                    <TableCell className="font-medium">{formatShortId(manager.uuid)}</TableCell>
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
        onClose={() => setDeleteModal({ isOpen: false, itemId: 0, itemName: '' })}
        onConfirm={performDeleteCaseManager}
        title="Delete Case Manager"
        description={`Are you sure you want to delete ${deleteModal.itemName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
