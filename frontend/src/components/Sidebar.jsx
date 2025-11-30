import React from "react";
import { Home, User, Settings, HelpCircle, LogOut, FileText } from "lucide-react";

export default function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <div className="w-64 bg-gradient-to-b from-green-600 to-emerald-700 text-white flex flex-col h-screen fixed left-0 top-0 shadow-2xl">
      <div className="p-6 border-b border-green-500 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">HiringBuddy</h1>
      </div>

      <nav className="flex-1 py-6">
        {[
          { label: "Home", icon: Home },
          { label: "Profile", icon: User },
          { label: "Settings", icon: Settings },
          { label: "Help Center", icon: HelpCircle },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setCurrentPage(label.toLowerCase().replace(" ", ""))}
            className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-white hover:bg-opacity-10 transition ${
              currentPage === label.toLowerCase().replace(" ", "")
                ? "bg-white bg-opacity-20 border-r-4 border-white"
                : ""
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="font-semibold">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-green-500">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          className="w-full flex items-center gap-4 px-6 py-3 hover:bg-white hover:bg-opacity-10 rounded-xl transition"
        >
          <LogOut className="w-6 h-6" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
}
