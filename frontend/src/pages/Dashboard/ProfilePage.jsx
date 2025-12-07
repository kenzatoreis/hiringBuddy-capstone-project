// src/pages/Dashboard/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { User, Mail, Calendar, GraduationCap, BookOpen, Award, Camera, Edit2, Check, X } from "lucide-react";
import { getProfile, updateProfile } from "../../api"; 

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [tempData, setTempData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // fetch profile
  useEffect(() => {
    getProfile()
      .then((res) => {
        const data = res.data;
        const mapped = {
          username: data.username || "User",
          email: data.email || "",
          dateOfBirth: data.dob || "",
          major: data.major || "",
          minor: data.minor || "",
          specialization: data.specialization || "",
          bio: data.bio || "Passionate learner - update your bio soon!",
        };
        setProfileData(mapped);
        setTempData(mapped);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setMessage("Could not load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e) =>
    setTempData({ ...tempData, [e.target.name]: e.target.value });

  const handleSave = async () => {
  try {
    const payload = {
      username: tempData.username,
      dob: tempData.dateOfBirth || null, 
      major: tempData.major,
      minor: tempData.minor,
      specialization: tempData.specialization,
      
    };

    await updateProfile(payload);
    setProfileData({ ...tempData });
    setEditing(false);
    setMessage("Profile updated successfully!");
  } catch (err) {
    console.error("Update failed:", err);
    setMessage("Error updating profile.");
  }
};

  const handleCancel = () => {
    setTempData(profileData);
    setEditing(false);
  };

  if (loading)
    return <div className="text-center py-10 text-gray-500">Loading profile...</div>;
  if (!profileData)
    return <div className="text-center py-10 text-red-500">No profile found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition flex items-center gap-2"
          >
            <Edit2 className="w-5 h-5" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition flex items-center gap-2"
            >
              <X className="w-5 h-5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> Save
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-center font-semibold ${
            message.startsWith("Profile")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {profileData.username.charAt(0).toUpperCase()}
            </div>
            {editing && (
              <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition">
                <Camera className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">
            {profileData.username}
          </h2>
          <p className="text-gray-600">{profileData.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Username", icon: User, key: "username" },
            { label: "Email", icon: Mail, key: "email" },
            { label: "Date of Birth", icon: Calendar, key: "dateOfBirth", type: "date" },
            { label: "Major", icon: GraduationCap, key: "major" },
            { label: "Minor", icon: BookOpen, key: "minor" },
            { label: "Specialization", icon: Award, key: "specialization" },
          ].map(({ label, icon: Icon, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                {label}
              </label>
              {editing ? (
                <input
                  type={type || "text"}
                  name={key}
                  value={tempData[key]}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-800 font-medium">
                    {profileData[key] || "—"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Bio
          </label>
          {editing ? (
            <textarea
              name="bio"
              value={tempData.bio}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none"
            />
          ) : (
            <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">
              {profileData.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
