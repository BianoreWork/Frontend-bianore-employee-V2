import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { CreatePassword } from '../components/invitation/CreatePassword';
import { DocumentsChecklist } from '../components/invitation/DocumentsChecklist';
import { UploadDocuments } from '../components/invitation/UploadDocuments';
import { useAuth } from '../../contexts/AuthContext';
import {
  invitationService,
  type InvitationData,
  type OnboardingDocumentUpload,
} from '../../services/invitationService';

type Screen =
  | 'create-password'
  | 'documents-checklist'
  | 'upload-documents';

export default function InvitationOnboardingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const token = params.get('token') ?? '';
  const [screen, setScreen] = useState<Screen>('create-password');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [error, setError] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const goTo = (nextScreen: Screen) => setScreen(nextScreen);

  useEffect(() => {
    if (!token) {
      setError('Invitation token is missing. Please open the link from your email again.');
      setLoadingInvitation(false);
      return;
    }

    setLoadingInvitation(true);
    invitationService.show(token)
      .then(setInvitation)
      .catch(err => setError(err instanceof Error ? err.message : 'Invitation link is invalid or expired.'))
      .finally(() => setLoadingInvitation(false));
  }, [token]);

  const handleCreateAccount = async (password: string) => {
    if (!token) throw new Error('Invitation token is missing.');
    setCreatingAccount(true);
    try {
      const res = await invitationService.accept(token, password, password, invitation?.phone_number);
      setAuth(res.token, res.user);
      goTo('documents-checklist');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleSubmitDocuments = async (documents: OnboardingDocumentUpload[]) => {
    setUploadingDocuments(true);
    try {
      await Promise.all(documents.map(document => invitationService.uploadDocument(document)));
      navigate('/dashboard');
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleSkipDocs = () => {
    toast('You can complete your documents later from Profile > Documents.', {
      duration: 4000,
      icon: 'Documents',
    });
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen bg-white overflow-y-auto"
      style={{ maxWidth: '430px', margin: '0 auto' }}
    >
      {loadingInvitation && (
        <div className="min-h-screen flex items-center justify-center px-8 text-center">
          <div>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading invitation...</p>
          </div>
        </div>
      )}
      {!loadingInvitation && error && (
        <div className="min-h-screen flex items-center justify-center px-8 text-center">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">Invitation unavailable</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-white bg-blue-600 px-4 py-2.5 rounded-xl"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
      {!loadingInvitation && !error && (
        <>
          {screen === 'create-password' && (
            <CreatePassword
              employeeName={invitation?.employee_name}
              employeeEmail={invitation?.email}
              companyName={invitation?.company_name}
              isSubmitting={creatingAccount}
              onNext={handleCreateAccount}
            />
          )}
          {screen === 'documents-checklist' && (
            <DocumentsChecklist
              onUpload={() => goTo('upload-documents')}
              onSkip={handleSkipDocs}
            />
          )}
          {screen === 'upload-documents' && (
            <UploadDocuments
              isSubmitting={uploadingDocuments}
              onSubmit={handleSubmitDocuments}
              onSkip={handleSkipDocs}
            />
          )}
        </>
      )}
    </div>
  );
}
