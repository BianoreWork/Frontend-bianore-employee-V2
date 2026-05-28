import { api } from '../lib/api';

export interface PayslipComponent {
  id: number;
  component_name: string;
  component_type: 'earning' | 'deduction' | 'benefit';
  amount: number;
}

export interface Payslip {
  id: number;
  payslip_number: string;
  period_month: number;
  period_year: number;
  gross_salary: number;
  total_deduction: number;
  net_salary: number;
  status: 'draft' | 'generated' | 'sent';
  pdf_url: string | null;
  generated_at: string | null;
  sent_at: string | null;
  components?: PayslipComponent[];
}

export const payrollService = {
  getMyPayslips: (params?: { page?: number; perPage?: number }) => {
    const q = new URLSearchParams();
    if (params?.page)    q.set('page', String(params.page));
    q.set('per_page', String(params?.perPage ?? 24));
    return api.get<{ data: Payslip[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }>(`/payroll/payslips?${q}`);
  },

  getPayslipDetail: (id: number) =>
    api.get<{ data: Payslip }>(`/payroll/payslips/${id}`),

  getDownloadUrl: (id: number) =>
    api.get<{ url: string }>(`/payroll/payslips/${id}/download`),
};
