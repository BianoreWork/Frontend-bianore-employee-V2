import { useState } from "react";
import { Eye, EyeOff, Shield, ChevronRight, Lock } from "lucide-react";

interface Props {
  employeeName?: string;
  employeeEmail?: string;
  companyName?: string | null;
  isSubmitting?: boolean;
  onNext: (password: string) => Promise<void> | void;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2)).toUpperCase();
}

export function CreatePassword({
  employeeName = "Employee",
  employeeEmail = "",
  companyName = "Bianore People",
  isSubmitting = false,
  onNext,
}: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    try {
      await onNext(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account. Please try again.");
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#22c55e"];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top gradient header */}
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
          <div className="h-1.5 w-8 rounded-full bg-white" />
          <div className="h-1.5 w-3 rounded-full bg-white/30" />
          <div className="h-1.5 w-3 rounded-full bg-white/30" />
        </div>

        <h1 className="text-white font-bold" style={{ fontSize: "22px", lineHeight: "1.3" }}>
          Create your account
        </h1>
        <p className="text-blue-100 mt-1" style={{ fontSize: "14px" }}>
          You've been invited to join {companyName || "your company"} on Bianore People.
        </p>
      </div>

      <div className="flex-1 px-5 -mt-4">
        {/* Employee preview card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", fontSize: "16px" }}
            >
              {initials(employeeName)}
            </div>
            <div>
              <p className="font-semibold text-gray-900" style={{ fontSize: "15px" }}>{employeeName}</p>
              <p className="text-gray-500" style={{ fontSize: "13px" }}>{employeeEmail || "Complete your account"}</p>
              <p className="text-blue-600 font-medium" style={{ fontSize: "12px" }}>{companyName || "Bianore People"}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5" style={{ fontSize: "13px" }}>
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 outline-none text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white transition-all"
                style={{ fontSize: "15px" }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i <= strength ? strengthColor[strength] : "#e5e7eb" }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: strengthColor[strength] }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5" style={{ fontSize: "13px" }}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 outline-none text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white transition-all"
                style={{ fontSize: "15px" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500" style={{ fontSize: "13px" }}>
              {error}
            </p>
          )}

          {/* Helper text */}
          <p className="text-gray-500 text-center" style={{ fontSize: "12px" }}>
            Your account is created by your company. Create a password to access your employee app.
          </p>

          {/* CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", fontSize: "15px", opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
            <ChevronRight size={18} />
          </button>
        </form>

        {/* Secure note */}
        <div className="mt-4 flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3">
          <Shield size={15} className="text-blue-500 shrink-0" />
          <p className="text-blue-700" style={{ fontSize: "12px" }}>
            Your invitation link is secure and expires in 72 hours.
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
