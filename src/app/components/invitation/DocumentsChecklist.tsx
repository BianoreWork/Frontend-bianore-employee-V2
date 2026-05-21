import { FileText, Receipt, CreditCard, Camera, Phone, ChevronRight, SkipForward } from "lucide-react";

interface Props {
  onUpload: () => void;
  onSkip: () => void;
}

const docs = [
  {
    id: "ktp",
    icon: FileText,
    title: "ID Card / KTP",
    desc: "Upload front and back",
    badge: "Required",
    badgeColor: "#ef4444",
    badgeBg: "#fef2f2",
  },
  {
    id: "npwp",
    icon: Receipt,
    title: "Tax Number / NPWP",
    desc: "PAN or Tax ID",
    badge: "Required",
    badgeColor: "#ef4444",
    badgeBg: "#fef2f2",
  },
  {
    id: "bank",
    icon: CreditCard,
    title: "Bank Account",
    desc: "Bank details or statement",
    badge: "Required",
    badgeColor: "#ef4444",
    badgeBg: "#fef2f2",
  },
  {
    id: "photo",
    icon: Camera,
    title: "Profile Photo",
    desc: "Clear headshot photo",
    badge: "Optional",
    badgeColor: "#2563eb",
    badgeBg: "#eff6ff",
  },
  {
    id: "emergency",
    icon: Phone,
    title: "Emergency Contact",
    desc: "Contact person for emergency",
    badge: "Optional",
    badgeColor: "#2563eb",
    badgeBg: "#eff6ff",
  },
];

export function DocumentsChecklist({ onUpload, onSkip }: Props) {
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

        {/* Progress dots */}
        <div className="flex gap-2 mb-6">
          <div className="h-1.5 w-3 rounded-full bg-white/40" />
          <div className="h-1.5 w-3 rounded-full bg-white/40" />
          <div className="h-1.5 w-8 rounded-full bg-white" />
        </div>

        <h1 className="text-white font-bold" style={{ fontSize: "22px", lineHeight: "1.3" }}>
          Complete Your Documents
        </h1>
        <p className="text-blue-100 mt-1" style={{ fontSize: "14px" }}>
          You can upload your documents now or do it later.
        </p>
      </div>

      <div className="flex-1 px-5 -mt-4">
        {/* Document cards */}
        <div className="flex flex-col gap-3 mb-5">
          {docs.map(({ id, icon: Icon, title, desc, badge, badgeColor, badgeBg }) => (
            <div
              key={id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-gray-900 font-semibold" style={{ fontSize: "14px" }}>{title}</p>
                  <span
                    className="rounded-full px-2 py-0.5 font-medium"
                    style={{ fontSize: "10px", color: badgeColor, background: badgeBg }}
                  >
                    {badge}
                  </span>
                </div>
                <p className="text-gray-400" style={{ fontSize: "12px" }}>{desc}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#d1d5db" }}
                />
                <span className="text-gray-400" style={{ fontSize: "11px" }}>Missing</span>
              </div>
            </div>
          ))}
        </div>

        {/* Helper text */}
        <p className="text-center text-gray-400 mb-5" style={{ fontSize: "12px" }}>
          You can complete your documents later from Profile &rsaquo; Documents.
        </p>

        {/* CTA buttons */}
        <button
          onClick={onUpload}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold mb-3"
          style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", fontSize: "15px" }}
        >
          Upload Now
          <ChevronRight size={18} />
        </button>

        <button
          onClick={onSkip}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-blue-600 font-semibold border-2 border-blue-200 bg-blue-50"
          style={{ fontSize: "15px" }}
        >
          <SkipForward size={16} />
          Skip for Now
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
