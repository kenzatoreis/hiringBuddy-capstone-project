import { useState } from "react";
import { indexResume, matchResume } from "../api";

export default function FileUpload({ onResults }) {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!file || !jd.trim()) return alert("Please upload CV and paste JD.");
    setLoading(true);
    try {
      await indexResume(file, "Kenza Toreis");
      const res = await matchResume(jd);
      onResults(res.data.results);
    } catch (err) {
      console.error(err);
      alert("Error during comparison");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <textarea
        rows="8"
        placeholder="Paste job description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />
      <button onClick={handleCompare} disabled={loading}>
        {loading ? "Analyzing..." : "Compare"}
      </button>
    </div>
  );
}
