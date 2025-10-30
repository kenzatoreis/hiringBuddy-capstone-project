import axios from "axios";

const API = "http://127.0.0.1:8000";

export const peekDoc = (file) => {
  const form = new FormData();
  form.append("file", file);
  return axios.post(`${API}/peek_doc`, form);
};

export const indexResume = (file, name) => {
  const form = new FormData();
  form.append("file", file);
  form.append("candidate_name", name);
  return axios.post(`${API}/index_resume_mem`, form);
};

export const matchResume = (jdText) => {
  return axios.post(`${API}/match_mem`, { requirement: jdText });
};
export const draftCVWithHeaders = (resumeText, jdText, missing, headers) => {
  return axios.post(`${API}/draft_cv_with_headers`, {
    resume_text: resumeText,
    job_description: jdText,
    missing: missing,
    headers: headers,
  });
};
// import axios from "axios";

// const API = "http://127.0.0.1:8000";

// export const http = axios.create({
//   baseURL: API,
//   timeout: 45000,
//   withCredentials: false,
// });

// http.interceptors.request.use((cfg) => {
//   console.log("[API →]", cfg.method?.toUpperCase(), cfg.url);
//   return cfg;
// });
// http.interceptors.response.use(
//   (res) => { console.log("[API ✓]", res.config.url, res.status); return res; },
//   (err) => {
//     console.log("[API ✗]", err?.config?.url, err?.message, err?.response?.status, err?.response?.data);
//     return Promise.reject(err);
//   }
// );

// export const peekDoc = (file) => {
//   const form = new FormData();
//   form.append("file", file);
//   return http.post(`/peek_doc`, form, { headers: { "Content-Type": "multipart/form-data" } });
// };

// export const indexResume = (file, name) => {
//   const form = new FormData();
//   form.append("file", file);
//   form.append("candidate_name", name);
//   return http.post(`/index_resume_mem`, form, { headers: { "Content-Type": "multipart/form-data" } });
// };

// export const matchResume = (jdText) => {
//   return http.post(`/match_mem`, { requirement: jdText });
// };

// export const draftCVWithHeaders = (resumeText, jdText, missing, headers) => {
//   return http.post(`/draft_cv_with_headers`, {
//     resume_text: resumeText,
//     job_description: jdText,
//     missing,
//     headers,
//   });
// };
