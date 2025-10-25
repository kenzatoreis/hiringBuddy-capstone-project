import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { auth } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      // backend expects { username, password }
      const r = await api.post("/auth/login", { username: email, password });

      // our api wrapper returns JSON directly (no .data)
      const token = r?.result?.access_token;
      if (!token) throw new Error("No token in response");

      auth.token = token; // saves to localStorage via your getter/setter
      nav("/ai", { replace: true }); // go straight to the AI workspace
    } catch (ex) {
      // our api wrapper throws Error(messageString)
      setMsg(ex?.message || "Login failed");
      console.error("Login error:", ex);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="logo" />
        <h1 className="h1 center">Log in to HiringBuddy</h1>
        <form onSubmit={submit}>
          <label className="label">Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ height: 8 }} />
          <button className="btn" type="submit" style={{ width: "100%" }}>
            Log in
          </button>
        </form>

        {msg && <div className="error">{msg}</div>}

        <div className="note center" style={{ marginTop: 14 }}>
          <Link to="#">I forgot my password</Link>
        </div>

        <div className="note center" style={{ marginTop: 8 }}>
          New user? <span style={{ width: 6 }} /> <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
