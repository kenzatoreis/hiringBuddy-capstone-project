// import React, { useState } from "react";
// import Sidebar from "../../components/Sidebar";
// import HomePage from "./HomePage";
// import ProfilePage from "./ProfilePage";
// import SettingsPage from "./SettingsPage";
// import HelpPage from "./HelpPage";
// import AIWorkspace from "../AIWorkspace";

// export default function Dashboard() {
//   const [currentPage, setCurrentPage] = useState("home");

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex">
//       <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
//       <div className="flex-1 ml-64 p-8 transition-all duration-300">
//         {currentPage === "home" && <HomePage />}
//         {currentPage === "profile" && <ProfilePage />}
//         {currentPage === "settings" && <SettingsPage />}
//         {currentPage === "helpcenter" && <HelpPage />}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import HelpPage from "./HelpPage";
import AIWorkspace from "../AIWorkspace"; 
import MatchesPage from "./MatchesPage";
import MatchDetailsPage from "./MatchDetailsPage";
import InterviewsPage from "./InterviewsPage";
import HistoryPage from "./HistoryPage";
import InterviewDetailsPage from "./InterviewDetailsPage";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState("home");

  
  useEffect(() => {
    const tab = (searchParams.get("tab") || "home").toLowerCase();
    setCurrentPage(tab);
  }, [searchParams]);

  
  const go = (tab) => setSearchParams({ tab });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={(tab) => go(tab)} //sidebar
      />
      <div className="flex-1 ml-64 p-8 transition-all duration-300">
        {currentPage === "home" && <HomePage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "settings" && <SettingsPage />}
        {currentPage === "helpcenter" && <HelpPage />}
        {currentPage === "ai" && <AIWorkspace />}   
        {currentPage === "matches" && <MatchesPage />} 
        {currentPage === "match" && <MatchDetailsPage />}
        {currentPage === "interviews" && <InterviewsPage />} 
        {currentPage === "history" && <HistoryPage />}
        {currentPage === "interview" && <InterviewDetailsPage />}
      </div>
    </div>
  );
}
