// src/pages/Dashboard/MatchDetailsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getMatchById } from "../../api";
import Results from "../../components/Results";

export default function MatchDetailsPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await getMatchById(id);
        setMatch(res.data);
      } catch (e) {
        console.error("MatchDetails load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // parse score from raw_json (same logic as AIWorkspace)
  const topScore = useMemo(() => {
    if (!match?.raw_json) return null;
    try {
      let txt = match.raw_json;
      if (typeof txt !== "string") txt = JSON.stringify(txt);
      txt = txt.replace(/```json\s*|```/g, "").trim();
      const parsed = JSON.parse(txt);
      return typeof parsed.score === "number" ? parsed.score : null;
    } catch {
      return null;
    }
  }, [match]);

  if (loading) {
    return <p className="text-sm text-gray-600">Loading match details…</p>;
  }

  if (!match) {
    return (
      <div>
        <button
          onClick={() => navigate("/dashboard?tab=history")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all matches
        </button>
        <p className="text-sm text-red-600">Match not found.</p>
      </div>
    );
  }

  const resultsData = [
    {
      candidate: match.resume_name || "Resume",
      llm_json: match.raw_json,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Match Results</h1>
          <p className="text-xs text-gray-500 mt-1">
            Requirements:{" "}
            <span className="font-medium">
              {match.job_title || "Untitled position"}
            </span>{" "}
            · {match.resume_name || "Resume"}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => navigate("/dashboard?tab=ai")}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            Go to AI Workspace <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/dashboard?tab=history")}
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all matches
          </button>
        </div>
      </div>

      {/* Gradient score card */}
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
              onClick={() => navigate("/dashboard?tab=ai")}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg"
            >
              Upload again <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Highlights / Missing card */}
      <div className="card p-4">
        <Results data={resultsData} />
      </div>
    </div>
  );
}
