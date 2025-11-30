// src/components/JobSearch.jsx
import { useState } from "react";
import { Search, MapPin, ExternalLink, RefreshCw } from "lucide-react";
import Btn from "./ui/Btn";
import { searchJobs } from "../api";

export default function JobSearch({ hasCv, jdText }) {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("Morocco");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [queryInfo, setQueryInfo] = useState(null);

  const handleSearch = async () => {
    if (!hasCv) {
      setError("Please upload and index your CV first in the Match step.");
      return;
    }
    if (!role.trim()) {
      setError("Please enter a target role (ex: Software Engineer, Data Analyst…).");
      return;
    }

    setError("");
    setLoading(true);
    setJobs([]);

    try {
      const res = await searchJobs(role.trim(), location, 10);
      setJobs(res.data.jobs || []);
      setQueryInfo({
        query: res.data.query,
        skills: res.data.skills_used || [],
        location: res.data.location,
      });
    } catch (err) {
      console.error("Job search error:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Error while searching jobs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasJd = !!jdText?.trim();

  return (
    <div className="space-y-6">
      {/* Controls card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-700">Search Jobs (Morocco)</h2>
            <p className="text-sm text-gray-600">
              We use your latest indexed CV and Serper.dev to find Moroccan job postings
              that match your skills.
            </p>
          </div>
        </div>

        {!hasCv && (
          <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800">
            No CV detected yet. Go to <b>Upload & Match</b> first, upload a CV and run the
            comparison so we can index your resume.
          </div>
        )}

        {hasJd && (
          <div className="rounded-xl p-3 bg-purple-50 border border-purple-200 text-xs text-purple-800">
            Tip: You can reuse the same role you just compared against this JD (eg.{" "}
            <b>“{jdText.split("\n")[0].slice(0, 40)}…”</b>).
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Target role
            </label>
            <input
              type="text"
              placeholder="e.g. Software Engineer Internship, Data Analyst, HR Assistant..."
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="input pl-9"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Use city or country (ex: Casablanca, Morocco).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Btn type="button" onClick={handleSearch} disabled={loading || !hasCv}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Searching...
              </span>
            ) : (
              "Find Matching Jobs"
            )}
          </Btn>

          {queryInfo && (
            <p className="text-xs text-gray-500">
              Last query: <span className="font-mono">{queryInfo.query}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {queryInfo?.skills?.length ? (
          <div className="text-xs text-gray-600">
            Skills used from your CV:
            <div className="mt-1 flex flex-wrap gap-1">
              {queryInfo.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[11px] text-green-800"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Results card */}
      <div className="card p-4 space-y-4">
        <h3 className="text-lg font-bold text-brand-700">Results</h3>

        {!loading && (!jobs || jobs.length === 0) && !error && (
          <p className="text-sm text-gray-500">
            No jobs yet. Fill the role, then click <b>Find Matching Jobs</b>.
          </p>
        )}

        {jobs && jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job, idx) => (
              <div
                key={`${job.link}-${idx}`}
                className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      {job.title || "Job posting"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {job.source && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {job.source} • #{job.position ?? idx + 1}
                      </p>
                    )}
                  </div>
                  {job.matched_skills?.length ? (
                    <div className="hidden md:flex flex-wrap gap-1 justify-end">
                      {job.matched_skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800"
                        >
                          {s}
                        </span>
                      ))}
                      {job.matched_skills.length > 4 && (
                        <span className="text-[10px] text-gray-500">
                          +{job.matched_skills.length - 4} more
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {job.snippet && (
                  <p className="mt-2 text-xs text-gray-600 line-clamp-3">
                    {job.snippet}
                  </p>
                )}

                {job.matched_skills?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1 md:hidden">
                    {job.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
