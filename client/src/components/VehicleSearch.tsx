import type { Vehicle } from '@/types';
import { formatShortId } from '@/utils/formatters';
import { fetchTopVehicleMatches } from '../utils/database';
import Search from './Search';

interface VehicleSearchProps {
  onVehicleSelect: (vehicle: Vehicle) => void;
}

export default function VehicleSearch({ onVehicleSelect }: VehicleSearchProps) {
  return (
    <Search<Vehicle>
      searchElementName="vehicle"
      fetchMatchesFn={fetchTopVehicleMatches}
      renderElementFn={renderVehicle}
      placeHolderText="Start typing vehicle name or ID"
    />
  );

  function renderVehicle(
    vehicle: Vehicle,
    handleElementSelect: (vehicle: Vehicle) => void
  ): React.JSX.Element {
    return (
      <div
        key={vehicle.uuid}
        onClick={() => {
          handleElementSelect(vehicle);
          onVehicleSelect(vehicle);
        }}
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
      >
        <div className="font-medium text-gray-900">{vehicle.displayName}</div>
        <div className="text-sm text-gray-500">ID: {formatShortId(vehicle.uuid)}</div>
      </div>
    );
  }
}
