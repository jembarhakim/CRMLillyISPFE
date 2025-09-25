export type CreateCompanyRequest = {
  name: string;
  url: string;
  email: string;
  phone: string;
  logo_url?: string;
  description?: string;
  npwp: string;
  address: string;
};

export type UpdateCompanyRequest = CreateCompanyRequest;

export type Company = {
  id: string;
  name: string;
  url: string;
  email: string;
  phone: string;
  logo_url?: string;
  description?: string;
  npwp: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};