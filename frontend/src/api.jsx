// import axios from "axios";

// const API = "http://127.0.0.1:8000/auth";

// export const registerUser = async (data) => {
//   return axios.post(`${API}/register`, data);
// };

// export const loginUser = async (email, password) => {
//   return axios.post(`${API}/login`, { email, password });
// };
// export async function getProfile() {
//   const token = localStorage.getItem("token");
//   return axios.get(`${API}/me`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
// }
// // Update current user profile
// export async function updateProfile(body) {
//   const token = localStorage.getItem("token");
//   return axios.put(`${API}/update`, body, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
// }
// api.jsx
import axios from "axios";

// Keep your existing auth base
const AUTH = "http://127.0.0.1:8000/auth";
// Add an admin base (same host, different prefix)
const ADMIN = "http://127.0.0.1:8000/admin";
const AI = "http://127.0.0.1:8000";
// export const apiJson = (url, data) =>
//   axios.post(url, data, { headers: { ...authHeader(), "Content-Type": "application/json" } });

// export const apiForm = (url, formData) =>
//   axios.post(url, formData, { headers: { ...authHeader(), "Content-Type": "multipart/form-data" } });


// Small helper so we don’t repeat header code
const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---------- Auth ----------
export const registerUser = async (data) => {
  return axios.post(`${AUTH}/register`, data);
};

export const loginUser = async (email, password) => {
  return axios.post(`${AUTH}/login`, { email, password });
};

export async function getProfile() {
  return axios.get(`${AUTH}/me`, { headers: authHeader() });
}

export async function updateProfile(body) {
  return axios.put(`${AUTH}/update`, body, { headers: authHeader() });
}

// (Dev only) seed first admin once, then remove/disable on prod
export async function seedAdmin(email) {
  return axios.post(`${AUTH}/seed_admin`, { email }, { headers: authHeader() });
}

// ---------- Admin (role = admin required) ----------
export async function adminListUsers() {
  return axios.get(`${ADMIN}/users`, { headers: authHeader() });
}

export async function adminSetUserRole(userId, role /* "admin" | "user" */) {
  return axios.patch(`${ADMIN}/users/${userId}/role`, { role }, { headers: authHeader() });
}

export async function adminDeleteUser(userId) {
  return axios.delete(`${ADMIN}/users/${userId}`, { headers: authHeader() });
}

const SUPPORT = "http://127.0.0.1:8000/support";
export const adminListComplaints = () =>
  axios.get(`${SUPPORT}/admin/complaints`, { headers: authHeader() });
export const adminSetComplaintStatus = (id, status) =>
  axios.patch(`${SUPPORT}/admin/complaints/${id}/status`, { status }, { headers: authHeader() });
// ---------- AI ----------
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

export const matchResume = (jdText) =>
  axios.post(`${AI}/ai/match_mem`, { requirement: jdText }, { headers: authHeader() });

export const draftCVWithHeaders = (resumeText, jdText, missing, headers) =>
  axios.post(
    `${AI}/ai/draft_cv_with_headers`,
    { resume_text: resumeText, job_description: jdText, missing, headers },
    { headers: authHeader() }
  );

export const listResumes = () =>
  axios.get(`${AI}/ai/resumes`, { headers: authHeader() });
export const deleteResume = (id) =>
  axios.delete(`${AI}/ai/resume/${id}`, { headers: authHeader() });