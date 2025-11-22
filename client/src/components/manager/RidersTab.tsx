import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from 'sonner';
import { formatShortId } from "@/utils/formatters";
import { useUsers, getApiUrl } from '@/lib/api';
import { TableSkeleton } from './TableSkeleton';

interface RidersTabProps {
  searchTerm: string;
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || ''
  };
}

export function RidersTab({ searchTerm }: RidersTabProps) {
  const { data: usersData, isLoading, refetch } = useUsers();

  const riders = (usersData as any)?.users || (Array.isArray(usersData) ? usersData : []);

  const handleDeleteRider = async (uuid: number) => {
    if (!confirm('Are you sure you want to delete this rider?')) return;
    
    try {
      const response = await fetch(getApiUrl(`/api/users/${uuid}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
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

  const filteredRiders = riders.filter(rider =>
    rider.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.phone?.includes(searchTerm)
  );

  return (
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRider(rider.uuid)}
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
  );
}
