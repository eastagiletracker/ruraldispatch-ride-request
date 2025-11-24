// Vehicle types
export interface Vehicle {
  uuid: string;
  displayName: string;
  fleetId: string;
  capacity: string | number;
  serviceArea: string;
  accessibilityFeatures: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type AccessibilityNeed =
  | 'None'
  | 'Walker Accessible'
  | 'Wheelchair Accessible'
  | 'Oxygen Tank Accessible';
