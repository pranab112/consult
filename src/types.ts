export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  agencyId: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  passportNumber: string;
  desiredCountry: string;
  desiredCourse: string;
  status: string;
  agencyId: string;
  createdAt: string;
  updatedAt: string;
}