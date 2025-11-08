import React, { useState } from "react";
import { User, Bell, Globe, Moon, Sun, Lock } from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">Settings</h1>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <User className="w-7 h-7 text-green-600" />
          Account Settings
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-800">Change Password</h3>
              <p className="text-sm text-gray-600">Update your password regularly</p>
            </div>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
              Change
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-800">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
            <button className="border-2 border-blue-500 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
              Enable
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
              <h3 className="font-semibold text-gray-800">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-14 h-8 rounded-full transition ${notifications ? "bg-green-500" : "bg-gray-300"}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition ${notifications ? "translate-x-7" : "translate-x-1"}`} />
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
            {darkMode ? <Moon className="w-6 h-6 text-gray-600" /> : <Sun className="w-6 h-6 text-gray-600" />}
            <div>
              <h3 className="font-semibold text-gray-800">Dark Mode</h3>
              <p className="text-sm text-gray-600">Switch to dark theme</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-14 h-8 rounded-full transition ${darkMode ? "bg-purple-500" : "bg-gray-300"}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition ${darkMode ? "translate-x-7" : "translate-x-1"}`} />
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
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-800">Data Export</h3>
              <p className="text-sm text-gray-600">Download your data</p>
            </div>
            <button className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition">
              Export
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-red-600">Delete Account</h3>
              <p className="text-sm text-red-400">Permanently delete your account</p>
            </div>
            <button className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
