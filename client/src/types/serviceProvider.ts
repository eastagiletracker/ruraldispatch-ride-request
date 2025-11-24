// Service Provider types
export interface ServiceProvider {
  uuid: string;
  fullName: string;
  title: string;
  organization: string;
  mobilePhone: string;
  serviceProviderRole: string;
  specializations: string;
  faxPhone: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ServiceProviderRole =
  | 'Transport Broker'
  | 'Staff'
  | 'Fleet Manager'
  | 'Driver'
  | 'Admin';

export type Specialization = 'Caseworker' | 'Nutritionist' | 'Intake';

export type Organization = 'EASTCONN' | 'Generations Health';
