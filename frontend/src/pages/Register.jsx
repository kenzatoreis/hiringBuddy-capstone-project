import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("");
  const [msg,setMsg] = useState("");
  const nav = useNavigate();

  const err = (e, fb) => {
    const d = e?.response?.data;
    if (!d) return e?.message || fb;
    if (typeof d.detail === "string") return d.detail;
    if (Array.isArray(d.detail) && d.detail[0]?.msg) return d.detail[0].msg;
    return fb;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/auth/register", { email, password, name: name || null });
      // after successful registration, go to login
      nav("/login", { replace: true });
    } catch (ex) {
      setMsg(err(ex, "Registration failed"));
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="logo" />
        <h1 className="h1 center">Create your account</h1>
        <form onSubmit={submit}>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@domain.com" />

          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />

          <label className="label">Name (optional)</label>
          <input className="input" value={name} onChange={(e)=>setName(e.target.value)} />

          <div style={{height:8}} />

          <button className="btn" type="submit" style={{width:"100%"}}>Create account</button>
        </form>

        {msg && <div className="error">{msg}</div>}

        <div className="note center" style={{marginTop:14}}>
          Already have an account? <span style={{width:6}} /> <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
