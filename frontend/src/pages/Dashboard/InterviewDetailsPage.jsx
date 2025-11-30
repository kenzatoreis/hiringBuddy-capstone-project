// src/pages/Dashboard/InterviewDetailsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getInterviewById } from "../../api";

export default function InterviewDetailsPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await getInterviewById(id);
        setInterview(res.data);
      } catch (e) {
        console.error("InterviewDetails load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const finalScore = useMemo(() => {
    if (!interview?.eval_json?.final) return null;
    const s = interview.eval_json.final.final_score;
    return typeof s === "number" ? s : null;
  }, [interview]);

  if (loading) {
    return <p className="text-sm text-gray-600">Loading interview details…</p>;
  }

  if (!interview) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/dashboard?tab=interviews")}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to interviews
        </button>
        <p className="text-sm text-red-600">Interview not found.</p>
      </div>
    );
  }

  const title = interview.job_title || "Mock Interview";
  const createdAt =
    interview.created_at &&
    !Number.isNaN(Date.parse(interview.created_at))
      ? new Date(interview.created_at).toLocaleString()
      : null;

  const perQuestion = interview.eval_json?.per_question || [];
  const final = interview.eval_json?.final || {};
  const strengths = final.strengths || [];
  const improvements = final.improvements || [];
  const resources = final.resources || [];

  const badgeClasses = (score) => {
    if (score >= 80) return "bg-gradient-to-br from-green-400 to-emerald-600";
    if (score >= 60) return "bg-gradient-to-br from-blue-400 to-cyan-600";
    return "bg-gradient-to-br from-orange-400 to-red-600";
  };

  const labelForScore = (score) => {
    if (score >= 85) return "Excellent performance";
    if (score >= 70) return "Good performance";
    if (score >= 50) return "Solid base";
    return "Needs more practice";
  };

  return (
    <div className="space-y-6">
      {/* top bar inside dashboard layout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Interview Feedback
          </h1>
          <p className="text-sm text-gray-600">
            {title}
            {createdAt ? ` • ${createdAt}` : ""}
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard?tab=interviews")}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all interviews
        </button>
      </div>

      {/* Final score card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-8 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Overall Interview Score</h2>
          <p className="text-pink-100 text-lg mb-2">
            {finalScore == null ? "—" : labelForScore(finalScore)}
          </p>
          <div className="text-6xl font-bold">
            {finalScore == null ? "—" : `${finalScore}%`}
          </div>
        </div>
      </div>

      {/* Strengths / improvements / resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-green-700 mb-2">
            Strengths
          </h3>
          {strengths.length ? (
            <ul className="list-disc ml-5 text-sm text-gray-700">
              {strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No strengths recorded.</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-orange-700 mb-2">
            Areas to Improve
          </h3>
          {improvements.length ? (
            <ul className="list-disc ml-5 text-sm text-gray-700">
              {improvements.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No improvements recorded.</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-blue-700 mb-2">
            Suggested Resources
          </h3>
          {resources.length ? (
            <ul className="list-disc ml-5 text-sm text-gray-700">
              {resources.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No resources listed.</p>
          )}
        </div>
      </div>

      {/* Per question breakdown */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Question-by-Question Feedback
        </h2>

        {perQuestion.length === 0 && (
          <p className="text-sm text-gray-600">
            No per-question feedback found for this interview.
          </p>
        )}

        <div className="space-y-4">
          {perQuestion.map((q, idx) => (
            <div
              key={q.id || idx}
              className="border rounded-xl p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Question {idx + 1}{" "}
                    <span className="text-xs text-gray-500">
                      ({q.id || "no-id"})
                    </span>
                  </h3>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${badgeClasses(
                    (q.score / 5) * 100
                  )}`}
                >
                  Score: {q.score}/5
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Feedback: </span>
                {q.feedback || "No feedback provided."}
              </p>

              {q.ideal_answer && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer">
                    See ideal answer
                  </summary>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                    {q.ideal_answer}
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
