// api.jsx
import axios from "axios";

const AUTH = "http://127.0.0.1:8000/auth";
const ADMIN = "http://127.0.0.1:8000/admin";
const AI    = "http://127.0.0.1:8000";
const SUPPORT = "http://127.0.0.1:8000/support";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ---------- Auth ---------- */
export const registerUser = (data) =>
  axios.post(`${AUTH}/register`, data);

export const loginUser = (email, password) =>
  axios.post(`${AUTH}/login`, { email, password });

export const getProfile = () =>
  axios.get(`${AUTH}/me`, { headers: authHeader() });

export const updateProfile = (body) =>
  axios.put(`${AUTH}/update`, body, { headers: authHeader() });

// dev-only
export const seedAdmin = (email) =>
  axios.post(`${AUTH}/seed_admin`, { email }, { headers: authHeader() });

/* ---------- Admin (users) ---------- */
export const adminListUsers = () =>
  axios.get(`${ADMIN}/users`, { headers: authHeader() });

export const adminSetUserRole = (userId, role /* "admin" | "user" */) =>
  axios.patch(`${ADMIN}/users/${userId}/role`, { role }, { headers: authHeader() });

export const adminDeleteUser = (userId) =>
  axios.delete(`${ADMIN}/users/${userId}`, { headers: authHeader() });

/* ---------- Support (tickets) ---------- */
// user create
export const createComplaint = (payload) =>
  axios.post(`${SUPPORT}/complaints`, payload, { headers: authHeader() });

// admin list / set status / delete
export const adminListComplaints = () =>
  axios.get(`${SUPPORT}/admin/complaints`, { headers: authHeader() });

export const adminSetComplaintStatus = (id, status) =>
  axios.patch(`${SUPPORT}/admin/complaints/${id}/status`, { status }, { headers: authHeader() });

export const adminDeleteComplaint = (id) =>
  axios.delete(`${SUPPORT}/admin/complaints/${id}`, { headers: authHeader() });

/* ---------- AI ---------- */
export const peekDoc = (file) => {
  const form = new FormData();
  form.append("file", file);
  return axios.post(`${AI}/ai/peek_doc`, form, { headers: authHeader() });
};

export const indexResume = (file, name) => {
  const form = new FormData();
  form.append("file", file);
  form.append("candidate_name", name);
  return axios.post(`${AI}/ai/index_resume_mem`, form, {
    headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
  });
};

export const matchResume = (jdText,language = "en") =>
  axios.post(`${AI}/ai/match_mem`, { requirement: jdText, language }, { headers: authHeader() });

export const draftCVWithHeaders = (resumeText, jdText, missing, headers, language = "en") =>
  axios.post(`${AI}/ai/draft_cv_with_headers`,
    { resume_text: resumeText, job_description: jdText, missing, headers,language },
    { headers: authHeader() });

export const listResumes = () =>
  axios.get(`${AI}/ai/resumes`, { headers: authHeader() });

export const deleteResume = (id) =>
  axios.delete(`${AI}/ai/resume/${id}`, { headers: authHeader() });

export const getSuggestions = (resumeText, jdText, missing = [], language = "en") =>
  axios.post(`${AI}/ai/suggestions_for_improvement`,
    { resume_text: resumeText, job_description: jdText, missing, language },
    { headers: authHeader() });

export const getInterviewQuestions = (payload) =>
  axios.post(`${AI}/ai/interviewer/questions`, payload, { headers: authHeader() });
export const evaluateInterview = (payload) =>
  axios.post(`${AI}/ai/interviewer/evaluate`, payload, { headers: authHeader() });

/* ---------- Account ---------- */
export const changePassword = (currentPassword, newPassword) =>
  axios.put(`${AUTH}/change-password`,
    { current_password: currentPassword, new_password: newPassword },
    { headers: authHeader() });

export const deleteAccount = () =>
  axios.delete(`${AUTH}/delete-account`, { headers: authHeader() });
// --- Job search  ---
export const searchJobs = (targetRole, location = "Morocco", numResults = 10) =>
  axios.post(
    `${AI}/ai/job_search_serper`,
    {
      target_role: targetRole,
      location,
      num_results: numResults,
    },
    { headers: authHeader() }
  );
//--- history 
export const getRecentMatches = (limit = 5) =>
  axios.get(`${AI}/ai/match_history/recent`, {
    params: { limit },
    headers: authHeader(),
  });

export const getAllMatches = () =>
  axios.get(`${AI}/ai/match_history`, {
    headers: authHeader(),
  });

export const getMatchById = async (id) => {
  return axios.get(`${AI}/ai/match_history/${id}`, { headers: authHeader() });
};
// ---------- Interview history ----------
export const getAllInterviews = async () => {
  return axios.get(`${AI}/ai/interview_history`, {
    headers: { ...authHeader() },
  });
};

export const getInterviewById = async (id) => {
  return axios.get(`${AI}/ai/interview_history/${id}`, {
    headers: { ...authHeader() },
  });
};
// ---------- Password reset (not logged in) ----------
export const requestPasswordReset = async (email) => {
  return axios.post(`${AUTH}/forgot-password`, { email });
};

export const resetPassword = async (token, newPassword) => {
  return axios.post(`${AUTH}/reset-password`, {
    token,
    new_password: newPassword,
  });
};
//ats
export const extractKeywords = async (text) => {
  return axios.post(`${AI}/ai/extract_keywords`, { text }, {
    headers: authHeader(),
  });
};
