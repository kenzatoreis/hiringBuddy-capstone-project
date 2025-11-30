/* frontend/src/pages/Dashboard/SettingsPage.jsx */
import React, { useState } from "react";
import { User, Bell, Globe, Moon, Sun, Lock } from "lucide-react";
import { changePassword, deleteAccount } from "../../api";

// pop up window modal
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  // backdrop blur
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // ------- Change password modal -------
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // ------- Delete account modal -------
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canSubmitPassword =
    currentPwd.trim() &&
    newPwd.trim() &&
    confirmPwd.trim() &&
    newPwd === confirmPwd &&
    !pwdLoading;

  const canDelete = deleteText === "DELETE" && !deleteLoading;

  const handleSubmitPassword = async () => {
    if (!canSubmitPassword) return;

    if (newPwd !== confirmPwd) {
    
      alert("New password and confirmation do not match.");
      return;
    }

    try {
      setPwdLoading(true);
      await changePassword(currentPwd, newPwd);
      alert("Password changed successfully");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setShowPwdModal(false);
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not change password");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) return;

    try {
      setDeleteLoading(true);
      await deleteAccount();
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* PAGE CONTENT */}
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-gray-800">Settings</h1>

        {/* Account */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <User className="w-7 h-7 text-green-600" />
            Account Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="font-semibold text-gray-800">Change Password</h3>
                <p className="text-sm text-gray-600">
                  Update your password regularly
                </p>
              </div>
              <button
                onClick={() => setShowPwdModal(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Bell className="w-7 h-7 text-purple-600" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="font-semibold text-gray-800">
                  Email Notifications
                </h3>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-14 h-8 rounded-full transition ${
                  notifications ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition ${
                    notifications ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Globe className="w-7 h-7 text-blue-600" />
            Appearance
          </h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-6 h-6 text-gray-600" />
              ) : (
                <Sun className="w-6 h-6 text-gray-600" />
              )}
              <div>
                <h3 className="font-semibold text-gray-800">Dark Mode</h3>
                <p className="text-sm text-gray-600">Switch to dark theme</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 rounded-full transition ${
                darkMode ? "bg-purple-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition ${
                  darkMode ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Lock className="w-7 h-7 text-red-600" />
            Privacy & Security
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div>
                <h3 className="font-semibold text-red-600">Delete Account</h3>
                <p className="text-sm text-red-400">
                  Permanently delete your account
                </p>
              </div>
              <button
                onClick={() => {
                  setDeleteText("");
                  setShowDeleteModal(true);
                }}
                className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------- Change Password pop wind -------- */}
      <Modal
        open={showPwdModal}
        title="Change Password"
        onClose={() => {
          if (!pwdLoading) setShowPwdModal(false);
        }}
      >
        {/* 🔒 Stop browser autofill madness */}
        <form autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              disabled={pwdLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              disabled={pwdLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              disabled={pwdLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => !pwdLoading && setShowPwdModal(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitPassword}
              disabled={!canSubmitPassword}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white ${
                canSubmitPassword
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              {pwdLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* -------- Delete Account Modal -------- */}
      <Modal
        open={showDeleteModal}
        title="Delete Account"
        onClose={() => {
          if (!deleteLoading) setShowDeleteModal(false);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            This will permanently delete your account and all your data from
            HiringBuddy. This action cannot be undone.
          </p>
          <p className="text-sm text-red-600 font-semibold">
            To confirm, type <span className="font-mono">DELETE</span> below:
          </p>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            disabled={deleteLoading}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => !deleteLoading && setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={!canDelete}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white ${
                canDelete
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-red-300 cursor-not-allowed"
              }`}
            >
              {deleteLoading ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
