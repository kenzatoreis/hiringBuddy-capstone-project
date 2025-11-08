import React from "react";
import { Upload, FileText, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function HomePage() {
  const navigate = useNavigate();   
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">Welcome back, Kenza 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
          <Upload className="w-12 h-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Upload New CV</h3>
          <p className="text-green-100 mb-6">Start matching your CV with job descriptions</p>
          <button
      onClick={() => navigate("/ai")}
      className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
    >
      Get Started
    </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <FileText className="w-12 h-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Recent Matches</h3>
          <p className="text-purple-100 mb-6">View your previous CV comparisons</p>
          <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition">
            View All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { action: "Uploaded CV", time: "2 hours ago", score: "85%" },
            { action: "Compared with Software Engineer role", time: "1 day ago", score: "92%" },
            { action: "Updated profile", time: "3 days ago", score: "-" },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{activity.action}</h3>
                  <p className="text-sm text-gray-600">{activity.time}</p>
                </div>
              </div>
              {activity.score !== "-" && (
                <div className="text-green-600 font-bold">{activity.score}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
