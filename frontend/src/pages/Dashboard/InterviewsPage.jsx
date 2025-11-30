// src/pages/Dashboard/InterviewsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllInterviews } from "../../api";
import { MessageCircle } from "lucide-react";

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter & sort
  const [filterType, setFilterType] = useState("all"); 
  const [sortBy, setSortBy] = useState("date-new"); // date-new or $

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllInterviews();
        const rawItems = res.data.items || res.data || [];
        setInterviews(rawItems);
      } catch (e) {
        console.error("InterviewsPage load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let arr = [...interviews];

    // filter by score bucket
    arr = arr.filter((it) => {
      const s = typeof it.score === "number" ? it.score : 0;
      if (filterType === "excellent") return s >= 85;
      if (filterType === "good") return s >= 70 && s < 85;
      if (filterType === "needs") return s < 70;
      return true;
    });

    // sort
    arr.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      const sa = typeof a.score === "number" ? a.score : 0;
      const sb = typeof b.score === "number" ? b.score : 0;

      switch (sortBy) {
        case "date-old":
          return da - db;
        case "score-high":
          return sb - sa;
        case "score-low":
          return sa - sb;
        case "date-new":
        default:
          return db - da;
      }
    });

    return arr;
  }, [interviews, filterType, sortBy]);

  const badgeClasses = (score) => {
    if (score >= 80) return "bg-gradient-to-br from-green-400 to-emerald-600";
    if (score >= 60) return "bg-gradient-to-br from-blue-400 to-cyan-600";
    return "bg-gradient-to-br from-orange-400 to-red-600";
  };

  const labelForScore = (score) => {
    if (score >= 85) return "Excellent Interview";
    if (score >= 70) return "Good Interview";
    if (score >= 50) return "Average Interview";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>

      {/* Top gradient bar (same style as matches) */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl px-6 py-4 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm text-gray-800 bg-white border-0 focus:outline-none"
          >
            <option value="all">All Interviews</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="needs">Needs Improvement</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm text-gray-800 bg-white border-0 focus:outline-none"
          >
            <option value="date-new">Sort by Date (Newest)</option>
            <option value="date-old">Sort by Date (Oldest)</option>
            <option value="score-high">Sort by Score (High to Low)</option>
            <option value="score-low">Sort by Score (Low to High)</option>
          </select>
        </div>

        <div className="text-sm text-purple-50 md:text-right">
          Showing{" "}
          <span className="font-semibold">{filteredAndSorted.length}</span>{" "}
          {filteredAndSorted.length === 1 ? "interview" : "interviews"}
        </div>
      </div>

      {/* List */}
      {loading && (
        <p className="text-sm text-gray-600">Loading your interviews…</p>
      )}

      {!loading && filteredAndSorted.length === 0 && (
        <p className="text-sm text-gray-600">
          No interviews yet. Run a mock interview in the AI Workspace to see
          them here.
        </p>
      )}

      <div className="space-y-4">
        {!loading &&
          filteredAndSorted.map((item) => {
            const score =
              typeof item.score === "number" ? item.score : null;
            const date =
              item.created_at &&
              !Number.isNaN(Date.parse(item.created_at))
                ? new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-1">
                    {/* Left score column */}
                    <div
                      className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white font-bold ${badgeClasses(
                        score ?? 0
                      )}`}
                    >
                      <span className="text-3xl">
                        {score != null ? score : "—"}
                      </span>
                      <span className="text-xs">SCORE</span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          {item.job_title || "Mock Interview"}
                        </h3>
                        {score != null && (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {labelForScore(score)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Simulated interview based on your CV + JD
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        {date && (
                          <div className="text-gray-500">Taken on {date}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                    onClick={() => navigate(`/dashboard?tab=interview&id=${item.id}`)}
                    className="bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
                    >
                    <MessageCircle className="w-4 h-4" />
                    View Feedback
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
