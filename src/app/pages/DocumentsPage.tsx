import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { UploadDocuments } from '../components/invitation/UploadDocuments';
import {
  invitationService,
  type OnboardingDocumentUpload,
} from '../../services/invitationService';

export default function DocumentsPage() {
  const navigate = useNavigate();

  const handleSubmit = async (documents: OnboardingDocumentUpload[]) => {
    await Promise.all(documents.map(document => invitationService.uploadDocument(document)));
    toast.success('Documents uploaded for HR review.');
    navigate('/dashboard');
  };

  return (
    <UploadDocuments
      onSubmit={handleSubmit}
      onSkip={() => navigate('/dashboard')}
    />
  );
}
