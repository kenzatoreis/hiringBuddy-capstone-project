// import { useState } from "react";
// import { indexResume, matchResume } from "../api";

// export default function FileUpload({ onResults }) {
//   const [file, setFile] = useState(null);
//   const [jd, setJd] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleCompare = async () => {
//     if (!file || !jd.trim()) return alert("Please upload CV and paste JD.");
//     setLoading(true);
//     try {
//       await indexResume(file, "Kenza Toreis");
//       const res = await matchResume(jd);
//       onResults(res.data.results);
//     } catch (err) {
//       console.error(err);
//       alert("Error during comparison");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-4 flex flex-col gap-3">
//       <input type="file" onChange={(e) => setFile(e.target.files[0])} />
//       <textarea
//         rows="8"
//         placeholder="Paste job description here..."
//         value={jd}
//         onChange={(e) => setJd(e.target.value)}
//       />
//       <button onClick={handleCompare} disabled={loading}>
//         {loading ? "Analyzing..." : "Compare"}
//       </button>
//     </div>
//   );
// }
import { useState } from "react";
import { peekDoc, indexResume, matchResume } from "../api";

export default function FileUpload({ onResults, setResumeText, setJdText }) {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!file || !jd.trim()) {
      alert("Please upload a CV and paste a Job Description first.");
      return;
    }
    setLoading(true);
    try {
      // 1️⃣ Preview CV text
      const peek = await peekDoc(file);
      setResumeText(peek.data.head); // ⚙️ save resume text for the draft agent

      // 2️⃣ Index resume in memory
      await indexResume(file, "placeholder");

      // 3️⃣ Save JD text for draft agent
      setJdText(jd);

      // 4️⃣ Run matching (semantic comparison)
      const res = await matchResume(jd);
      onResults(res.data.results);
    } catch (err) {
      console.error(err);
      alert("Error comparing resume and JD.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <textarea
        rows="6"
        placeholder="Paste Job Description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        onClick={handleCompare}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Analyzing..." : "Compare"}
      </button>
    </div>
  );
}
// // src/components/FileUpload.jsx
// import { useState } from "react";
// import { peekDoc, indexResume, matchResume } from "../api";

// export default function FileUpload({ onResults, setResumeText, setJdText }) {
//   const [file, setFile] = useState(null);
//   const [jd, setJd] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleCompare = async () => {
//     console.log("[FileUpload] Compare clicked");
//     if (!file || !jd.trim()) { alert("Please upload a CV and paste a Job Description first."); return; }
//     setLoading(true);
//     try {
//       console.time("peekDoc");
//       const peek = await peekDoc(file);
//       console.timeEnd("peekDoc");
//       setResumeText(peek.data.head);

//       console.time("indexResume");
//       await indexResume(file, "Kenza Toreis");
//       console.timeEnd("indexResume");

//       setJdText(jd);

//       console.time("matchResume");
//       const res = await matchResume(jd);
//       console.timeEnd("matchResume");

//       onResults(res.data.results);
//     } catch (err) {
//       console.error("[Compare ERROR]", err);
//       alert(err?.response?.data?.detail || err.message || "Error comparing resume and JD.");
//     } finally {
//       setLoading(false);
//       console.log("[FileUpload] Compare finished");
//     }
//   };

//   return (
//     <div className="p-4 flex flex-col gap-3">
//       <input type="file" onChange={(e) => setFile(e.target.files[0])} />
//       <textarea
//         rows="6"
//         placeholder="Paste Job Description here..."
//         value={jd}
//         onChange={(e) => setJd(e.target.value)}
//         className="border p-2 rounded"
//       />
//       <button
//         type="button"                  // <- important
//         onClick={handleCompare}
//         disabled={loading}
//         className="bg-blue-500 text-white px-4 py-2 rounded"
//       >
//         {loading ? "Analyzing..." : "Compare"}
//       </button>
//     </div>
//   );
// }

