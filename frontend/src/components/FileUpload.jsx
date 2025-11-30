// import { useState } from "react";
// import { peekDoc, indexResume, matchResume } from "../api";
// import Btn from "./ui/Btn";

// export default function FileUpload({ onResults, setResumeText, setJdText }) {
//   const [file, setFile] = useState(null);
//   const [jd, setJd] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleCompare = async () => {
//     if (!file || !jd.trim()) return alert("Please upload a CV and paste a Job Description first.");
//     setLoading(true);
//     try {
//       const peek = await peekDoc(file);
//       setResumeText(peek.data.head);
//       await indexResume(file, "Placeholder");
//       setJdText(jd);
//       const res = await matchResume(jd);
//       onResults(res.data.results);
//     } catch (err) {
//       console.error(err);
//       alert("Error comparing resume and JD.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="card space-y-4">
//       <h3 className="text-xl font-bold text-brand-700">Upload CV</h3>
//       <input type="file" onChange={(e) => setFile(e.target.files[0])} className="input" />
//       <h3 className="text-x1 font-bold text-brand-700">Upload Job Description</h3>
//       <textarea
//         rows="6"
//         placeholder="Paste Job Description here..."
//         value={jd}
//         onChange={(e) => setJd(e.target.value)}
//         className="textarea"
//       />
//       <Btn onClick={handleCompare} disabled={loading}>
//         {loading ? "Analyzing..." : "Compare"}
//       </Btn>
//     </div>
//   );
// }
// src/components/FileUpload.jsx
import Btn from "./ui/Btn";

export default function FileUpload({
  file,
  setFile,
  jd,
  setJd,
  loading,
  onCompare,
}) {
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="card space-y-4">
      {/* CV upload */}
      <h3 className="text-xl font-bold text-brand-700">Upload CV</h3>

      <div
        className={`flex items-center justify-center w-full`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition
          ${
            loading
              ? "bg-gray-300 border-gray-500 cursor-not-allowed opacity-70"
              : "bg-gray-100 border-gray-400 hover:bg-gray-200"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center text-sm">
            {/* icon */}
            <svg
              className="w-8 h-8 mb-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"
              />
            </svg>

            <p className="mb-1 text-sm">
              <span className="font-semibold">
                {loading ? "Uploading disabled…" : "Click to upload"}
              </span>{" "}
              {!loading && "or drag and drop"}
            </p>
            <p className="text-xs text-gray-500">
              PDF, DOCX or TXT (max a few MB)
            </p>

            {file && (
              <p className="mt-2 text-xs text-gray-700">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            disabled={loading}
          />
        </label>
      </div>

      {/* JD textarea */}
      <h3 className="text-xl font-bold text-brand-700">
        Upload Job Description
      </h3>

      <div className="rounded-xl p-4 bg-purple-50 border border-purple-200 text-sm text-purple-800">
        Better results when the JD includes responsibilities, required
        tech/tools, and seniority/years of experience.
      </div>

      <textarea
        rows="6"
        placeholder="Paste Job Description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        className="textarea"
        disabled={loading}
      />

      {/* Compare button */}
      <Btn
        type="button"
        onClick={(e) => {
          e?.preventDefault?.();
          onCompare();
        }}
        disabled={loading || !file || !jd.trim()}
      >
        {loading ? "Analyzing..." : "Compare"}
      </Btn>
    </div>
  );
}
