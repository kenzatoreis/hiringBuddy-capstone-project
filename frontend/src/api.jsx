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
