// src/components/FileUpload.jsx
import { useState } from "react";
import { peekDoc, indexResume, matchResume } from "../api";
import Btn from "./ui/Btn";

export default function FileUpload({ onResults, setResumeText, setJdText }) {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!file || !jd.trim()) return alert("Please upload a CV and paste a Job Description first.");
    setLoading(true);
    try {
      const peek = await peekDoc(file);
      setResumeText(peek.data.head);
      await indexResume(file, "Placeholder");
      setJdText(jd);
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
    <div className="card space-y-4">
      <h3 className="text-xl font-bold text-brand-700">Upload & Match</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="input" />
      <textarea
        rows="6"
        placeholder="Paste Job Description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        className="textarea"
      />
      <Btn onClick={handleCompare} disabled={loading}>
        {loading ? "Analyzing..." : "Compare"}
      </Btn>
    </div>
  );
}
