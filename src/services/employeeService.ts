import { api } from '../lib/api';

export interface TaxProfile {
  id?: number;
  nik?: string | null;
  npwp?: string | null;
  ptkp_code?: string | null;
  tax_method?: string | null;
}

export interface BpjsProfile {
  id?: number;
  bpjs_kesehatan_number?: string | null;
  bpjs_ketenagakerjaan_number?: string | null;
  bpjs_kesehatan_active?: boolean;
  jht_active?: boolean;
  jp_active?: boolean;
  jkk_active?: boolean;
  jkm_active?: boolean;
}

export const employeeService = {
  getTaxProfile: (employeeId: number) =>
    api.get<{ data: TaxProfile }>(`/employees/${employeeId}/tax-profile`),

  updateTaxProfile: (employeeId: number, data: Partial<TaxProfile>) =>
    api.put<{ data: TaxProfile; message: string }>(`/employees/${employeeId}/tax-profile`, data),

  getBpjsProfile: (employeeId: number) =>
    api.get<{ data: BpjsProfile }>(`/employees/${employeeId}/bpjs-profile`),

  updateBpjsProfile: (employeeId: number, data: Partial<BpjsProfile>) =>
    api.put<{ data: BpjsProfile; message: string }>(`/employees/${employeeId}/bpjs-profile`, data),
};
