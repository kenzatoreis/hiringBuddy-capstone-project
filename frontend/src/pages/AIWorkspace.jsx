import { useEffect, useMemo, useState } from "react";
import Results from "../components/Results";
import HeaderEditor from "../components/HeaderEditor";
import SuggestionsCard from "../components/SuggestionsCard";
import DraftViewer from "../components/DraftViewer";
import Interviewer from "../components/Interviewer";
import FileUpload from "../components/FileUpload";
import JobSearch from "../components/JobSearch";
import { extractKeywords } from "../api";

import {
  draftCVWithHeaders,
  getProfile,
  peekDoc,
  indexResume,
  matchResume, 
} from "../api";
import {
  ChevronRight,
  ArrowLeft,
  Target,
  Edit3,
  MessageCircle,
  Search,
} from "lucide-react";

export default function AIWorkspace() {
  const [language, setLanguage] = useState("en");
  // view include upload...results...draft...interview..jobs done
  const [view, setView] = useState("upload");
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  // ai
  const [results, setResults] = useState([]);
  const [draft, setDraft] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [missing, setMissing] = useState([]);
  const [jdKeywords, setJdKeywords] = useState([]);
  const [keywordStatus, setKeywordStatus] = useState([]);
  const normalizeText = (txt) =>
  (txt || "")
    .replace(/\s+/g, " ")             // collapse weird Word spacing (fix for "J a v a")
    .replace(/[^\w+.,/# ]/g, " ")      // remove invisible formatting characters
    .toLowerCase()
    .trim();

const normalizeKeyword = (txt) =>
  (txt || "")
    .replace(/[^a-zA-Z0-9+]/g, "")     // remove weird chars ("Re ac t" becomes "react")
    .toLowerCase()
    .trim();

  useEffect(() => {
    getProfile().catch((err) => {
      console.error("getProfile error:", err?.response?.data || err.message);
    });
  }, []);
  // bubbles
useEffect(() => {
  if (!jdKeywords.length || !resumeText) {
    setKeywordStatus([]);
    return;
  }

  const cleanResume = normalizeText(resumeText);
  const normalizedResume = normalizeKeyword(cleanResume);

  const status = jdKeywords.map((k) => {
    const keyNorm = normalizeKeyword(k);
    return {
      name: k,
      exists: normalizedResume.includes(keyNorm),
    };
  });

  setKeywordStatus(status);
}, [jdKeywords, resumeText]);

  const cvOk = !!resumeText?.trim();
  const jdOk = !!jdText?.trim();

  // parse first result’s score for the big card
  const topScore = useMemo(() => {
    if (!results?.length) return null;
    try {
      let txt = results[0].llm_json;
      if (typeof txt !== "string") txt = JSON.stringify(txt);
      txt = txt.replaceAll("```json", "").replaceAll("```", "").trim();
      const parsed = JSON.parse(txt);
      return typeof parsed.score === "number" ? parsed.score : null;
    } catch {
      return null;
    }
  }, [results]);

  // handle /match_mem output
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
    
    setView("results");
  };

  // compare flow
  const handleCompare = async () => {
    if (!file || !jd.trim()) {
      alert("Please upload a CV and paste a Job Description first.");
      return;
    }
    setLoading(true);
    try {
      const peek = await peekDoc(file);
      setResumeText(peek.data.full || peek.data.head);


      await indexResume(file, "Placeholder");

      setJdText(jd);

      const res = await matchResume(jd, language);
      handleResults(res.data.results);
      // literal keywotd extraction
      const kw = await extractKeywords(jd);
      setJdKeywords(kw.data.keywords || []);
    // this sets results + view="results"
    } catch (err) {
      console.error(err);
      alert("Error comparing resume and JD.");
    } finally {
      setLoading(false);
    }
  };

  // draft generator
  const handleGenerateDraft = async (headers) => {
    try {
      const res = await draftCVWithHeaders(resumeText, jdText, missing, headers, language);
      setDraft(res.data.draft);
    } catch (err) {
      console.error("Draft generation error:", err);
      alert("Error generating CV draft.");
    }
  };

  // --- pages ---

  const UploadPage = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">CV Match Analysis</h1>
        <p className="text-lg text-gray-600">
          Upload your CV and compare it against job requirements
        </p>
      </div>

      
        {/* Left: Upload & Match */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Upload & Match</h2>
          </div>

          <FileUpload
            // controlled
            file={file}
            setFile={setFile}
            jd={jd}
            setJd={setJd}
            loading={loading}
            onCompare={handleCompare}
          />

          <p className="text-xs text-gray-600 mt-3">
            Current uploads • CV: <b>{file ? "✓" : "—"}</b> • JD:{" "}
            <b>{jd?.trim() ? "✓" : "—"}</b>
          </p>
        </div>

        
        {/* <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Tips</h2>
          <p className="text-sm text-gray-600 mb-4">
            Paste the job description in the left card (inside Upload & Match) to
            start the comparison.
          </p>
          <div className="rounded-xl p-4 bg-purple-50 border border-purple-200 text-sm text-purple-800">
            Better results when the JD includes responsibilities, required tech/tools,
            and seniority/years of experience.
          </div>
        </div> */}
      
    </div>
  );

  const ResultsPage = () => (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">Match Results</h1>

      {/* Score card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Overall Match Score</h2>
            <p className="text-blue-100 text-lg mb-2">
              {topScore == null
                ? "—"
                : topScore >= 80
                ? "Excellent match!"
                : topScore >= 60
                ? "Good match!"
                : "Needs improvement"}
            </p>
            <div className="text-6xl font-bold">
              {topScore == null ? "—" : `${topScore}%`}
            </div>
          </div>
          <div className="hidden md:block text-right">
            <button
              onClick={() => setView("upload")}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg"
            >
              Upload again <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Highlights / Missing */}
      <div className="card p-4">
        <Results data={results} showScore={false} />
      </div>
      {/* ----- ATS Literal Keyword Extraction Card ----- */}
      {jdKeywords.length > 0 && keywordStatus.length > 0 && (
        <div className="card p-4 mt-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">ATS Keyword Match</h2>

          <div className="flex flex-wrap gap-2">
            {keywordStatus.map((k, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  k.exists
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}
              >
                {k.name}
              </span>
            ))}
          </div>

          <p className="text-sm mt-3">
          <span className="font-semibold text-green-600">Green</span>
          <span className="text-gray-600"> = your resume explicitly contains the keyword.</span>
          <br />
          <span className="font-semibold text-red-600">Red</span>
          <span className="text-gray-600"> = missing (semantic evaluation may still detect equivalents).</span>
        </p>

        </div>
      )}

      {/* Suggestions */}
      {cvOk && jdOk ? (
        <SuggestionsCard resumeText={resumeText} jdText={jdText} missing={missing} language={language}/>
      ) : null}

      {/* Next actions */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8 border-2 border-purple-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          What would you like to do next?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setView("draft")}
            className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Edit3 className="w-7 h-7 text-white" />
            </div>
            <div className="text-center text-green-700 font-semibold">
              Create CV Draft <ChevronRight className="inline w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setView("interview")}
            className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="text-center text-purple-700 font-semibold">
              Simulate Interview <ChevronRight className="inline w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setView("jobs")}
            className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-white" />
            </div>
            <div className="text-center text-blue-700 font-semibold">
              Search Jobs <ChevronRight className="inline w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const DraftPage = () => (
    <div className="space-y-6">
      <button
        onClick={() => setView("results")}
        className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-4">
          <h2 className="section-title mb-3">CV Sections</h2>
          <HeaderEditor onGenerate={handleGenerateDraft} />
        </div>
        <div className="lg:col-span-2 card p-4">
          <DraftViewer draft={draft} />
        </div>
      </div>
    </div>
  );

  const InterviewPage = () => (
    <div className="space-y-6">
      <button
        onClick={() => setView("results")}
        className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Results
      </button>

      <div className="card p-4">
        <Interviewer resumeText={resumeText} jdText={jdText} language={language}/>
      </div>
    </div>
  );

  const JobsPage = () => (
  <div className="space-y-6">
    <button
      onClick={() => setView("results")}
      className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
    >
      <ArrowLeft className="w-5 h-5" /> Back to Results
    </button>

    <JobSearch hasCv={cvOk} jdText={jdText} />
  </div>
);


 return (
  
    <div className="space-y-6">
    {/* Language toggle */}
    <div className="flex justify-end gap-2">
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-full text-sm border ${
          language === "en"
            ? "bg-brand-600 text-white border-brand-600"
            : "bg-white text-gray-700 border-gray-300"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("fr")}
        className={`px-3 py-1 rounded-full text-sm border ${
          language === "fr"
            ? "bg-brand-600 text-white border-brand-600"
            : "bg-white text-gray-700 border-gray-300"
        }`}
      >
        FR
      </button>
    </div>
      <div className={view === "upload" ? "" : "hidden"}>
        <UploadPage />
      </div>
      <div className={view === "results" ? "" : "hidden"}>
        <ResultsPage />
      </div>
      <div className={view === "draft" ? "" : "hidden"}>
        <DraftPage />
      </div>
      <div className={view === "interview" ? "" : "hidden"}>
        <InterviewPage />
      </div>
      <div className={view === "jobs" ? "" : "hidden"}>
        <JobsPage />
      </div>
    </div>
  );
}
