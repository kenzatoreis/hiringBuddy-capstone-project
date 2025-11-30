// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  Target,
  Edit3,
  Lightbulb,
  Award,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfile, getRecentMatches } from "../../api";

export default function HomePage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("there");
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // get user for greeting
        const me = await getProfile();
        const profile = me.data.profile || {};
        const username =
          profile.username ||
          (me.data.username);
        setDisplayName(username);

        // get last few matches for preview
        const hist = await getRecentMatches(3);
        setRecentMatches(hist.data.items || []);
      } catch (e) {
        console.error("HomePage load error", e);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">
        Welcome, {displayName} !
      </h1>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
          <Upload className="w-12 h-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Upload New CV</h3>
          <p className="text-green-100 mb-6">
            Start matching your CV with job descriptions
          </p>
          <button
            onClick={() => navigate("/dashboard?tab=ai")}
            className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
          >
            Get Started
          </button>
        </div>

        {/* Recent matches card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <FileText className="w-12 h-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Recent Matches</h3>
          <p className="text-purple-100 mb-4">
            View your previous CV comparisons
          </p>

          

          <button
          onClick={() => navigate("/dashboard?tab=history")}
          className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
        >
          View All
        </button>

        </div>
      </div>

      {/* Why HiringBuddy? section – unchanged, just using your text */}

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Why HiringBuddy?
          </h2>
          <p className="text-lg text-gray-600">
            Bridging the Gap Between Talent and Opportunity!
          </p>
        </div>

        <div className="space-y-6">
          {/* Problem */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-l-4 border-red-500 hover:shadow-lg transition">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  The Problem
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  <span className="font-semibold text-red-600">
                    Students and early-career candidates often meet or exceed
                    technical requirements
                  </span>
                  , yet fail to communicate their potential effectively due to
                  weak resume structuring, poor tailoring, and lack of clarity.
                  Strong candidates are filtered out prematurely by traditional
                  keyword-based systems.
                </p>
              </div>
            </div>
          </div>

          {/* Semantic matching */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-l-4 border-green-500 hover:shadow-lg transition">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Beyond Keywords: Semantic Matching
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  HiringBuddy uses{" "}
                  <span className="font-semibold text-green-600">
                    advanced semantic analysis and multi-AI agents
                  </span>{" "}
                  to understand the contextual meaning of your skills and
                  experience, not just keywords. We analyze both resumes and job
                  descriptions at a deeper level, ensuring your true
                  competencies are recognized and valued.
                </p>
              </div>
            </div>
          </div>

          {/* Tailored resumes */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  AI-Powered Resume Tailoring
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  We{" "}
                  <span className="font-semibold text-blue-600">
                    automatically generate tailored resume drafts
                  </span>{" "}
                  optimized for specific job descriptions, highlighting your
                  strengths and addressing missing skills with actionable
                  suggestions. Present your competencies clearly and
                  professionally, aligned with what recruiters are actually
                  looking for.
                </p>
              </div>
            </div>
          </div>

          {/* Explainable feedback */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-l-4 border-purple-500 hover:shadow-lg transition">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Clear, Actionable Insights
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Receive{" "}
                  <span className="font-semibold text-purple-600">
                    transparent, explainable feedback
                  </span>{" "}
                  on your match score, highlighted strengths, and specific areas
                  for improvement. Understand exactly why
                  you're a good fit and what steps to take to become even
                  stronger.
                </p>
              </div>
            </div>
          </div>

          {/* Fair & efficient */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-l-4 border-yellow-500 hover:shadow-lg transition">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Supporting Both Candidates & Recruiters
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  While focused on helping{" "}
                  <span className="font-semibold text-orange-600">
                    AUI students and early-career professionals
                  </span>{" "}
                  showcase their true level, HiringBuddy also supports HR teams
                  by surfacing the best-aligned candidates with transparent
                  justifications, making screening{" "}
                  <span className="font-semibold text-orange-600">
                    faster, fairer, and more efficient
                  </span>{" "}
                  for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Our Mission</h3>
          <p className="text-xl text-green-50 leading-relaxed max-w-4xl mx-auto">
            To help align AUI candidates with their actual skills and level of
            competence, ensuring that qualified talent is recognized and given
            fair opportunities, while making the hiring process more transparent
            and efficient for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
