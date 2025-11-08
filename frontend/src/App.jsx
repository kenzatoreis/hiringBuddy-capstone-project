// import { useState } from "react";
// import FileUpload from "./components/FileUpload";
// import Results from "./components/Results";
// import HeaderEditor from "./components/HeaderEditor";
// import { draftCVWithHeaders } from "./api";
// import DraftViewer from "./components/DraftViewer";  
// export default function App() {
//   const [results, setResults] = useState([]);
//   const [draft, setDraft] = useState(null);
//   const [resumeText, setResumeText] = useState("");
//   const [jdText, setJdText] = useState("");
//   const [missing, setMissing] = useState([]);

//   // --- handle AI match results ---
//   const handleResults = (res) => {
//     setResults(res);
//     if (res?.length > 0) {
//       try {
//         // extract “missing” from the first candidate result
//         // let txt = res[0].llm_json;
//         // if (typeof txt !== "string") txt = JSON.stringify(txt);
//         // txt = txt.replace(/```json\s*|```/g, "").trim();
//         // const parsed = JSON.parse(txt);
//         let txt = res[0].llm_json;
// if (typeof txt !== "string") txt = JSON.stringify(txt);
// txt = txt.replaceAll("```json", "").replaceAll("```", "").trim();
// const parsed = JSON.parse(txt);
//         setMissing(parsed.missing || []);
//       } catch (err) {
//         console.error("Could not parse results", err);
//       }
//     }
//   };

//   // --- called when user clicks “Generate Draft” ---
//   const handleGenerateDraft = async (headers) => {
//     try {
//       const res = await draftCVWithHeaders(resumeText, jdText, missing, headers);
//       setDraft(res.data.draft);
//     } catch (err) {
//       console.error("Draft generation error:", err);
//       alert("Error generating CV draft.");
//     }
//   };

//   return (
//     <div className="min-h-screen">
//       {/* Top bar */}
//       <header className="bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow">
//         <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
//           <h1 className="text-xl font-semibold">HiringBuddy</h1>
//           <div className="text-sm opacity-90">AI Resume Match & Draft</div>
//         </div>
//       </header>

//       {/* Main grid */}
//       <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left column */}
//         <section className="lg:col-span-1 space-y-6">
//           <div className="card p-4">
//             <h2 className="section-title mb-3">Upload & Compare</h2>
//             <FileUpload
//               onResults={handleResults}
//               setResumeText={setResumeText}
//               setJdText={setJdText}
//             />
//           </div>
//           <div className="card p-4">
//             <h2 className="section-title mb-3">CV Sections</h2>
//             <HeaderEditor onGenerate={handleGenerateDraft} />
//           </div>
//         </section>

//         {/* Right column */}
//         <section className="lg:col-span-2 space-y-6">
//           <div className="card p-4">
//             <h2 className="section-title mb-3">Match Results</h2>
//             <Results data={results} />
//           </div>
//           <div className="card p-4">
//             <DraftViewer draft={draft} />
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CVMatcherAuth from "./pages/Auth/CVMatcherAuth";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import { getRoleFromToken } from "./utils/authroles";
import AIWorkspace from "./pages/AIWorkspace";   // 👈 new import

function Home() {
  const token = localStorage.getItem("token");
  return (
    <div className="p-10">
      {token ? (
        <h2 className="text-green-600 font-semibold text-xl">
          Welcome! You are logged in ✅
        </h2>
      ) : (
        <h2 className="text-red-600 font-semibold text-xl">
          Please log in ❌
        </h2>
      )}
    </div>
  );
}

function AdminRoute({ children }) {
  const role = getRoleFromToken();
  return role === "admin" ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
  
      <Routes>
        <Route path="/" element={<CVMatcherAuth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 👇 New AI workspace route */}
        <Route path="/ai" element={<AIWorkspace />} />

        {/* Admin area */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
      </Routes>
   
  );
}
