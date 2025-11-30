import React, { useState, useEffect } from "react";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage({
        text: "Missing or invalid reset token.",
        type: "error",
      });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!newPassword || !confirm) {
      setMessage({ text: "Please fill in both fields.", type: "error" });
      return;
    }
    if (newPassword !== confirm) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await resetPassword(token, newPassword);
      setMessage({
        text: "Password has been reset successfully. You can now log in.",
        type: "success",
      });

      // redirect to login after a short delay
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Could not reset password. The link may have expired.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-4">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Reset Your Password
            </h2>
            <p className="text-gray-600 text-lg">
              Enter a new password for your account
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border-2 border-green-200 text-green-800"
                  : "bg-red-50 border-2 border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition text-gray-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition text-gray-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
