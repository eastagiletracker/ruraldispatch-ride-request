import { Briefcase, Clipboard, Search, Truck, Users } from 'lucide-react';
import { useState } from 'react';
import { CaseManagersTab } from '@/components/manager/CaseManagersTab';
import { DispatchersTab } from '@/components/manager/DispatchersTab';
import { ProvidersTab } from '@/components/manager/ProvidersTab';
import { RidersTab } from '@/components/manager/RidersTab';
import { VehiclesTab } from '@/components/manager/VehiclesTab';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Manager() {
  const [activeTab, setActiveTab] = useState('riders');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['riders']));

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm(''); // Clear search when changing tabs
    // Mark this tab as loaded so data fetching is triggered
    setLoadedTabs((prev) => new Set(prev).add(value));
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">System Manager</h1>
        <p className="text-muted-foreground">
          Manage riders, drivers/staff (assignable to rides), vehicles, dispatchers, and case
          managers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="riders" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Riders
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="dispatchers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Dispatchers
          </TabsTrigger>
          <TabsTrigger value="case-managers" className="flex items-center gap-2">
            <Clipboard className="w-4 h-4" />
            Case Managers
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Riders Tab - Only loads data when tab is active or has been visited */}
        <TabsContent value="riders" className="space-y-4">
          {loadedTabs.has('riders') && <RidersTab searchTerm={searchTerm} />}
        </TabsContent>

        {/* Providers Tab - Lazy loaded */}
        <TabsContent value="providers" className="space-y-4">
          {loadedTabs.has('providers') && <ProvidersTab searchTerm={searchTerm} />}
        </TabsContent>

        {/* Vehicles Tab - Lazy loaded */}
        <TabsContent value="vehicles" className="space-y-4">
          {loadedTabs.has('vehicles') && <VehiclesTab searchTerm={searchTerm} />}
        </TabsContent>

        {/* Dispatchers Tab - Lazy loaded */}
        <TabsContent value="dispatchers" className="space-y-4">
          {loadedTabs.has('dispatchers') && <DispatchersTab searchTerm={searchTerm} />}
        </TabsContent>

        {/* Case Managers Tab - Lazy loaded */}
        <TabsContent value="case-managers" className="space-y-4">
          {loadedTabs.has('case-managers') && <CaseManagersTab searchTerm={searchTerm} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
