import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import HelpPage from "./HelpPage";

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 ml-64 p-8 transition-all duration-300">
        {currentPage === "home" && <HomePage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "settings" && <SettingsPage />}
        {currentPage === "helpcenter" && <HelpPage />}
      </div>
    </div>
  );
}
