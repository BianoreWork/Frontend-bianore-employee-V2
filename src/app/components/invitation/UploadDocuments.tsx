import { useState } from "react";
import { Upload, FileText, Receipt, CreditCard, CheckCircle2, X, ChevronRight, Clock } from "lucide-react";
import type { OnboardingDocumentUpload } from "../../../services/invitationService";

interface DocState {
  file: File | null;
  uploaded: boolean;
}

interface Props {
  isSubmitting?: boolean;
  onSubmit: (documents: OnboardingDocumentUpload[]) => Promise<void> | void;
  onSkip: () => void;
}

const docDefs = [
  { id: "ktp", icon: FileText, title: "ID Card / KTP", desc: "Upload front and back sides", documentType: "ktp" as const },
  { id: "npwp", icon: Receipt, title: "Tax Number / NPWP", desc: "PAN or Tax ID", documentType: "other" as const },
  { id: "bank", icon: CreditCard, title: "Bank Account", desc: "Bank details or statement", documentType: "other" as const },
];

export function UploadDocuments({ isSubmitting = false, onSubmit, onSkip }: Props) {
  const [docs, setDocs] = useState<Record<string, DocState>>({
    ktp: { file: null, uploaded: false },
    npwp: { file: null, uploaded: false },
    bank: { file: null, uploaded: false },
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (id: string, file: File | null) => {
    if (!file) return;
    setDocs((prev) => ({ ...prev, [id]: { file, uploaded: true } }));
  };

  const handleRemove = (id: string) => {
    setDocs((prev) => ({ ...prev, [id]: { file: null, uploaded: false } }));
  };

  const anyUploaded = Object.values(docs).some((d) => d.uploaded);

  const handleSubmit = async () => {
    const uploads = docDefs
      .map((definition) => {
        const file = docs[definition.id]?.file;
        if (!file) return null;

        return {
          documentType: definition.documentType,
          documentName: definition.title,
          file,
        };
      })
      .filter((document): document is OnboardingDocumentUpload => document !== null);

    setError("");
    try {
      await onSubmit(uploads);
      setSubmitted(true);
      setTimeout(() => undefined, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload documents. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white px-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, #bbf7d0, #86efac)" }}
        >
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-gray-900 font-bold text-center mb-2" style={{ fontSize: "20px" }}>
          Documents Submitted!
        </h2>
        <p className="text-gray-500 text-center" style={{ fontSize: "14px" }}>
          Documents submitted for HR review. Redirecting to your dashboard...
        </p>
        <div className="flex items-center gap-2 mt-5 text-blue-500">
          <Clock size={14} />
          <span style={{ fontSize: "12px" }}>HR will review within 1-2 business days</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div
        className="px-6 pt-14 pb-8"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BP</span>
          </div>
          <span className="text-white font-semibold text-base">Bianore People</span>
        </div>

        <h1 className="text-white font-bold" style={{ fontSize: "22px", lineHeight: "1.3" }}>
          Upload Documents
        </h1>
        <p className="text-blue-100 mt-1" style={{ fontSize: "14px" }}>
          Add your required employee documents.
        </p>
      </div>

      <div className="flex-1 px-5 -mt-4">
        <div className="flex flex-col gap-4 mb-6">
          {docDefs.map(({ id, icon: Icon, title, desc }) => {
            const state = docs[id];
            return (
              <div
                key={id}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                style={{ borderColor: state.uploaded ? "#bbf7d0" : "#f1f5f9" }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: state.uploaded ? "#f0fdf4" : "#eff6ff" }}
                    >
                      {state.uploaded ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <Icon size={18} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold" style={{ fontSize: "14px" }}>{title}</p>
                      <p className="text-gray-400" style={{ fontSize: "12px" }}>{desc}</p>
                      {state.uploaded && state.file && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <FileText size={11} className="text-green-500" />
                          <span className="text-green-600 font-medium truncate" style={{ fontSize: "11px" }}>
                            {state.file.name}
                          </span>
                        </div>
                      )}
                    </div>
                    {state.uploaded && (
                      <button
                        onClick={() => handleRemove(id)}
                        className="text-gray-300 hover:text-gray-500 shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {!state.uploaded ? (
                    <label
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-blue-200 text-blue-500 cursor-pointer hover:bg-blue-50 transition-all"
                      style={{ fontSize: "13px" }}
                    >
                      <Upload size={15} />
                      <span>Choose File</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFile(id, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  ) : (
                    <label
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-50 transition-all"
                      style={{ fontSize: "13px" }}
                    >
                      <Upload size={14} />
                      <span>Replace File</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFile(id, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!anyUploaded || isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold mb-3 transition-all"
          style={{
            background: anyUploaded && !isSubmitting
              ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
              : "#d1d5db",
            fontSize: "15px",
          }}
        >
          {isSubmitting ? "Uploading Documents..." : "Submit Documents"}
          {!isSubmitting && <ChevronRight size={18} />}
        </button>

        {error && (
          <p className="text-center text-red-500 mb-3" style={{ fontSize: "12px" }}>{error}</p>
        )}

        <button
          onClick={onSkip}
          className="w-full py-3.5 rounded-xl text-gray-500 font-semibold border border-gray-200 bg-gray-50"
          style={{ fontSize: "15px" }}
        >
          Do This Later
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
