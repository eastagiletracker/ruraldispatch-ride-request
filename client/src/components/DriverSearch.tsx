import Search from './Search';
import { fetchTopProviderMatches } from "../utils/database";
import { formatShortId } from "@/utils/formatters";
import type { ServiceProvider } from "@/types";

interface DriverSearchProps {
    onDriverSelect: (driver: ServiceProvider) => void;
}

export default function DriverSearch({ onDriverSelect }: DriverSearchProps) {

    return (
        <Search<ServiceProvider>
            searchElementName="driver"
            fetchMatchesFn={fetchTopProviderMatches}
            renderElementFn={renderDriver}
            placeHolderText="Start typing driver name or ID"
        />
    )

    function renderDriver(driver: ServiceProvider, handleElementSelect: (driver: ServiceProvider) => void): React.JSX.Element {
        return (
            <div
                key={driver.uuid}
                onClick={() => {
                    handleElementSelect(driver)
                    onDriverSelect(driver)
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
                <div className="font-medium text-gray-900">{driver.fullName}</div>
                <div className="text-sm text-gray-500">
                    ID: {formatShortId(driver.uuid)} • Phone: {driver.mobilePhone}
                </div>
            </div>
        )
    }
} 