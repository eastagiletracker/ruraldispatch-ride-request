import type { Vehicle } from '@/types';
import { formatShortId } from '@/utils/formatters';
import { fetchTopVehicleMatches } from '../utils/database';
import Search from './Search';


interface VehicleSearchProps {
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicle?: { uuid: string; displayName?: string; model?: string };
}


export default function VehicleSearch({ onVehicleSelect, selectedVehicle }: VehicleSearchProps) {
  return (
    <Search<Vehicle>
      searchElementName="vehicle"
      fetchMatchesFn={fetchTopVehicleMatches}
      renderElementFn={(vehicle, handleElementSelect) =>
        renderVehicle(vehicle, handleElementSelect, selectedVehicle)
      }
      placeHolderText="Start typing vehicle name or ID"
    />
  );

  function renderVehicle(
    vehicle: Vehicle,
    handleElementSelect: (vehicle: Vehicle) => void,
    selectedVehicle?: { uuid: string; displayName?: string; model?: string }
  ): React.JSX.Element {
    const isSelected = selectedVehicle && selectedVehicle.uuid === vehicle.uuid;
    return (
      <button
        key={vehicle.uuid}
        type="button"
        onClick={() => {
          handleElementSelect(vehicle);
          onVehicleSelect(vehicle);
        }}
        className={`w-full px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-left ${isSelected ? 'bg-green-100 font-bold' : ''}`}
      >
        <div className="font-medium text-gray-900">{vehicle.displayName}</div>
        <div className="text-sm text-gray-500">ID: {formatShortId(vehicle.uuid)}</div>
        {isSelected && <span className="ml-2 text-green-600">✓ Selected</span>}
      </button>
    );
  }
}
