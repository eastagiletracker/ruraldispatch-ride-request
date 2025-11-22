// Import types from shared schemas
import type { RideRequestFormData, ServiceProvider, User, Vehicle } from '@shared/schemas';

// Form error types
export type FormErrors<T> = {
  [K in keyof T]?: string;
} & {
  [key: string]: string | undefined;
};

// Component prop types
export interface FormComponentProps {
  setShowBaseForm: (show: boolean) => void;
  setShowUserForm: (show: boolean) => void;
}

// Re-export RideRequestFormData from shared schemas
export type { RideRequestFormData } from '@shared/schemas';

export interface RideRequestFormErrors {
  riderName?: string;
  riderPickupBaseAddress?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupRequestedDate?: string;
  pickupRequestedTime?: string;
  dropoffRequestedDate?: string;
  dropoffRequestedTime?: string;
}

export interface SelectedUser {
  uuid: string;
  fullName: string;
  phone?: string;
  residence?: {
    current?: string;
    last?: string;
  };
}

export interface RideRequestFormProps {
  selectedUser?: SelectedUser;
  setShowRideRequestForm?: (show: boolean) => void;
  setShowBaseForm?: (show: boolean) => void;
  setShowUserForm?: (show: boolean) => void;
  caseManagerName?: string;
  caseManagerUsername?: string;
}

export interface UserSearchProps {
  onUserSelect: (user: User) => void;
}

export interface DriverSearchProps {
  onDriverSelect: (driver: ServiceProvider) => void;
}

export interface VehicleSearchProps {
  onVehicleSelect: (vehicle: Vehicle) => void;
}

// Generic search element type
export type SearchableElement = User | ServiceProvider | Vehicle;

export interface SearchProps<T extends SearchableElement> {
  searchElementName: string;
  fetchMatchesFn: (searchTerm: string) => Promise<T[]>;
  placeHolderText: string;
  renderElementFn: (element: T, handleElementSelect: (element: T) => void) => React.ReactElement;
}
