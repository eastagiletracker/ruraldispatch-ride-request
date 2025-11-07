// User types
export interface User {
  uuid: string;
  fullName: string;
  phone: string;
  dob: string;
  race: string;
  maritalStatus: string;
  residence: {
    current: string;
    last: string;
  };
  income: {
    current: string;
    last: string;
  };
  serviceUserRole: string[];
  veteranStatus: string;
  disabilityStatus: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Select option types for User
export type RaceOption =
  | "black"
  | "white"
  | "asian"
  | "latino"
  | "native american"
  | "other"
  | "prefer not to say";

export type MaritalStatusOption =
  | "single"
  | "married"
  | "divorced"
  | "widowed"
  | "separated"
  | "other"
  | "prefer not to say";

export type VeteranStatusOption =
  | "veteran"
  | "not veteran"
  | "prefer not to say";

export type DisabilityStatusOption =
  | "yes"
  | "no"
  | "prefer not to say";

export type ServiceUserRole =
  | "rider"
  | "caregiver"
  | "relative"
  | "guardian"
  | "case manager"
  | "other";
