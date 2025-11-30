// src/pages/Dashboard/HistoryPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMatches, getAllInterviews } from "../../api";
import { FileText, MessageCircle, CheckCircle, XCircle } from "lucide-react";

export default function HistoryPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("matches"); 
  const [loading, setLoading] = useState(true);

  const [matches, setMatches] = useState([]);
  const [interviews, setInterviews] = useState([]);

  const [sortBy, setSortBy] = useState("date-new");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const m = await getAllMatches().catch(() => ({ data: [] }));
        const i = await getAllInterviews().catch(() => ({ data: [] }));

        setMatches(m.data.items || m.data || []);
        setInterviews(i.data.items || i.data || []);
      } catch (e) {
        console.error("History load error", e);
      }
      setLoading(false);
    })();
  }, []);

  const data = useMemo(() => {
    let arr = mode === "matches" ? matches : interviews;
    arr = [...arr];

    arr.sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();

      const sa = a.score || 0;
      const sb = b.score || 0;

      switch (sortBy) {
        case "score-high": return sb - sa;
        case "score-low": return sa - sb;
        case "date-old": return da - db;
        default: return db - da;
      }
    });

    return arr;
  }, [mode, matches, interviews, sortBy]);

  const badgeClasses = (score) => {
    if (score >= 80) return "bg-gradient-to-br from-green-400 to-emerald-600";
    if (score >= 60) return "bg-gradient-to-br from-blue-400 to-cyan-600";
    return "bg-gradient-to-br from-orange-400 to-red-600";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">History</h1>

      {/* Unified Top Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl px-6 py-4 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm text-gray-800 bg-white border-0"
          >
            <option value="matches">Match History</option>
            <option value="interviews">Interview History</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm text-gray-800 bg-white border-0"
          >
            <option value="date-new">Date (Newest)</option>
            <option value="date-old">Date (Oldest)</option>
            <option value="score-high">Score (High → Low)</option>
            <option value="score-low">Score (Low → High)</option>
          </select>
        </div>

        <div className="text-sm text-blue-50 md:text-right">
          Showing{" "}
          <span className="font-semibold">{data.length}</span>{" "}
          {mode === "matches" ? "matches" : "interviews"}
        </div>
      </div>

      {/* List */}
      {loading && <p className="text-sm text-gray-600">Loading…</p>}

      {!loading && data.length === 0 && (
        <p className="text-sm text-gray-600">
          No {mode === "matches" ? "matches" : "interviews"} yet.
        </p>
      )}

      <div className="space-y-4">
        {!loading &&
          data.map((item) => {
            const score = item.score ?? item.final_score ?? null;
            const date =
              item.created_at &&
              !isNaN(Date.parse(item.created_at))
                ? new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

            const isMatch = mode === "matches";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-1">
                    {/* Score box */}
                    <div
                      className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white font-bold ${badgeClasses(
                        score
                      )}`}
                    >
                      <span className="text-3xl">{score ?? "—"}</span>
                      <span className="text-xs">SCORE</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {isMatch
                          ? item.job_title || "Job Match"
                          : item.job_title || "Mock Interview"}
                      </h3>

                      {isMatch && (
                        <p className="text-sm text-gray-600 mb-2">
                          {item.company || "Unknown company"} •{" "}
                          {item.resume_name || "Resume"}
                        </p>
                      )}

                      <div className="text-xs text-gray-500">{date}</div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                        navigate(
                            isMatch
                            ? `/dashboard?tab=match&id=${item.id}`
                            : `/dashboard?tab=interview&id=${item.id}`
                        )
                        }
                    className="bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                    {isMatch ? (
                        <>
                        <FileText className="w-4 h-4" />
                        View Match
                        </>
                    ) : (
                        <>
                        <MessageCircle className="w-4 h-4" />
                        View Interview
                        </>
                    )}
                    </button>

                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
