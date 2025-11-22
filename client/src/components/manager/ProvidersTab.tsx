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
import { getApiUrl, useServiceProviders } from '@/lib/api';
import { formatShortId } from '@/utils/formatters';
import { ProviderEditModal } from './ProviderEditModal';
import { TableSkeleton } from './TableSkeleton';

interface ProvidersTabProps {
  searchTerm: string;
  onUpdate?: () => {
    refetch: () => Promise<unknown>;
  };
}

// API response type - matches what the backend returns
interface ServiceProvider {
  uuid: string;
  fullName: string;
  title?: string;
  role: string;
  mobilePhone?: string;
  organization?: {
    name?: string;
  };
}

function getAuthHeaders() {
  const userRole = sessionStorage.getItem('user_role');
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole || '',
  };
}

export function ProvidersTab({ searchTerm }: ProvidersTabProps) {
  const navigate = useNavigate();
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const { data: providersData, isLoading, refetch } = useServiceProviders();

  const serviceProviders: ServiceProvider[] =
    (providersData as { serviceProviders?: ServiceProvider[] })?.serviceProviders ||
    (Array.isArray(providersData) ? providersData : []);

  const handleDeleteProvider = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this service provider?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/service-providers/${uuid}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Service provider deleted successfully');
        refetch();
      } else {
        toast.error(data.message || 'Failed to delete service provider');
      }
    } catch (error) {
      console.error('Error deleting service provider:', error);
      toast.error('Failed to delete service provider');
    }
  };

  const filteredProviders = serviceProviders.filter(
    (provider) =>
      provider.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.mobilePhone?.includes(searchTerm)
  );

  return (
    <>
      {editingProvider && (
        <ProviderEditModal
          provider={editingProvider}
          open={!!editingProvider}
          onClose={() => setEditingProvider(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Providers (Staff/Drivers)</CardTitle>
              <CardDescription>
                View and manage drivers, case workers, and staff members who can be assigned to
                rides
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/service-provider')}>Add Provider</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filteredProviders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No service providers found</p>
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
                    <TableCell className="font-medium">{formatShortId(provider.uuid)}</TableCell>
                    <TableCell>{provider.fullName || 'N/A'}</TableCell>
                    <TableCell>{provider.title || 'N/A'}</TableCell>
                    <TableCell>{provider.organization?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{provider.role || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{provider.mobilePhone || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProvider(provider)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProvider(provider.uuid)}
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
    </>
  );
}
