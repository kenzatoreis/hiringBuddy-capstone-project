import { useState } from "react";
import FileUpload from "../components/FileUpload";
import Results from "../components/Results";
import HeaderEditor from "../components/HeaderEditor";
import DraftViewer from "../components/DraftViewer";
import { draftCVWithHeaders } from "../api";

export default function AIWorkspace() {
  const [results, setResults] = useState([]);
  const [draft, setDraft] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [missing, setMissing] = useState([]);

  const handleResults = (res) => {
    setResults(res);
    if (res?.length > 0) {
      try {
        let txt = res[0].llm_json;
        if (typeof txt !== "string") txt = JSON.stringify(txt);
        txt = txt.replaceAll("```json", "").replaceAll("```", "").trim();
        const parsed = JSON.parse(txt);
        setMissing(parsed.missing || []);
      } catch (err) {
        console.error("Could not parse results", err);
      }
    }
  };

  const handleGenerateDraft = async (headers) => {
    try {
      const res = await draftCVWithHeaders(resumeText, jdText, missing, headers);
      setDraft(res.data.draft);
    } catch (err) {
      console.error("Draft generation error:", err);
      alert("Error generating CV draft.");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">HiringBuddy</h1>
          <div className="text-sm opacity-90">AI Resume Match & Draft</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 space-y-6">
          <div className="card p-4">
            <h2 className="section-title mb-3">Upload & Compare</h2>
            <FileUpload
              onResults={handleResults}
              setResumeText={setResumeText}
              setJdText={setJdText}
            />
          </div>
          <div className="card p-4">
            <h2 className="section-title mb-3">CV Sections</h2>
            <HeaderEditor onGenerate={handleGenerateDraft} />
          </div>
        </section>

        <section className="lg:col-span-2 space-y-6">
          <div className="card p-4">
            <h2 className="section-title mb-3">Match Results</h2>
            <Results data={results} />
          </div>
          <div className="card p-4">
            <DraftViewer draft={draft} />
          </div>
        </section>
      </main>
    </div>
  );
}
