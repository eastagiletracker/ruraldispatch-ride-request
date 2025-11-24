import type { ServiceProvider } from '@/types';
import { formatShortId } from '@/utils/formatters';
import { fetchTopProviderMatches } from '../utils/database';
import Search from './Search';

interface DriverSearchProps {
  onDriverSelect: (driver: ServiceProvider) => void;
  selectedDriver?: Pick<ServiceProvider, 'uuid' | 'fullName'> | ServiceProvider;
}

export default function DriverSearch({ onDriverSelect, selectedDriver }: DriverSearchProps) {
  return (
    <Search<ServiceProvider>
      searchElementName="driver"
      fetchMatchesFn={fetchTopProviderMatches}
      renderElementFn={(driver, handleElementSelect) =>
        renderDriver(driver, handleElementSelect, selectedDriver)
      }
      placeHolderText="Start typing driver name or ID"
    />
  );

  function renderDriver(
    driver: ServiceProvider,
    handleElementSelect: (driver: ServiceProvider) => void,
    selectedDriver?: Pick<ServiceProvider, 'uuid' | 'fullName'> | ServiceProvider
  ): React.JSX.Element {
    const isSelected = selectedDriver && selectedDriver.uuid === driver.uuid;
    return (
      <button
        key={driver.uuid}
        type="button"
        onClick={() => {
          handleElementSelect(driver);
          onDriverSelect(driver);
        }}
        className={`w-full px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-left ${isSelected ? 'bg-green-100 font-bold' : ''}`}
      >
        <div className="font-medium text-gray-900">{driver.fullName}</div>
        <div className="text-sm text-gray-500">
          ID: {formatShortId(driver.uuid)} • Phone: {driver.mobilePhone}
        </div>
        {isSelected && <span className="ml-2 text-green-600">✓ Selected</span>}
      </button>
    );
  }
}
