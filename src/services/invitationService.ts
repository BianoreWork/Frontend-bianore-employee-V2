import { api } from '../lib/api';
import type { User } from '../types/api';

export interface InvitationData {
  employee_name: string;
  company_name: string | null;
  email: string;
  phone_number: string | null;
  invitation_status: string;
  send_channel: string;
  expires_at: string | null;
}

interface InvitationShowResponse {
  message: string;
  data: InvitationData;
}

interface InvitationAcceptResponse {
  message: string;
  status: 'success';
  token: string;
  type: 'bearer';
  user: Omit<User, 'roles'> & { roles: User['roles'] | string[] };
  employee: {
    id: number;
    full_name: string;
    tenant: string | null;
  };
}

export interface OnboardingDocumentUpload {
  documentType: 'ktp' | 'contract' | 'ijazah' | 'other';
  documentName: string;
  file: File;
  notes?: string;
}

function normalizeUser(response: InvitationAcceptResponse): User {
  return {
    ...response.user,
    is_active: response.user.is_active ?? true,
    two_factor_enabled: response.user.two_factor_enabled ?? false,
    roles: response.user.roles.map((role, index) =>
      typeof role === 'string' ? { id: index + 1, name: role } : role,
    ),
    employee: {
      id: response.employee.id,
      full_name: response.employee.full_name,
      employee_code: '',
    },
  };
}

export const invitationService = {
  show: async (token: string) => {
    const response = await api.get<InvitationShowResponse>(`/invitations/${encodeURIComponent(token)}`);
    return response.data;
  },

  accept: async (token: string, password: string, passwordConfirmation: string, phoneNumber?: string | null) => {
    const response = await api.post<InvitationAcceptResponse>(`/invitations/${encodeURIComponent(token)}/accept`, {
      password,
      password_confirmation: passwordConfirmation,
      phone_number: phoneNumber || null,
    });

    return {
      ...response,
      user: normalizeUser(response),
    };
  },

  uploadDocument: (document: OnboardingDocumentUpload) => {
    const form = new FormData();
    form.append('document_type', document.documentType);
    form.append('document_name', document.documentName);
    form.append('file', document.file);
    if (document.notes) {
      form.append('notes', document.notes);
    }

    return api.postForm('/my/documents', form);
  },
};
