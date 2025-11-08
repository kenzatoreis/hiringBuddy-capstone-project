// src/utils/auth.js
export function getRoleFromToken() {
  const t = localStorage.getItem("token");
  if (!t) return "user";
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload.role || "user";
  } catch {
    return "user";
  }
}
