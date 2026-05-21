import { api } from '../lib/api';

export interface EmployeeDocument {
  id: number;
  document_type: string;
  type_label: string;
  document_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  uploaded_by: number;
  created_at: string;
}

interface DocumentsResponse {
  message: string;
  data: EmployeeDocument[];
}

export const documentsService = {
  myDocuments: async () => {
    const response = await api.get<DocumentsResponse>('/my/documents');
    return response.data;
  },
};
