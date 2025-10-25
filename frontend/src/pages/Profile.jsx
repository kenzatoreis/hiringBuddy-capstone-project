import { useEffect, useState } from "react";
import { api } from "../api";

export default function Profile() {
  const [me,setMe] = useState(null);
  const [msg,setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/auth/me");
        setMe(r.data);
      } catch (e) {
        setMsg(e?.response?.data?.detail || e.message || "Failed to load profile");
      }
    })();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Welcome</h1>
        {msg && <div className="error">{msg}</div>}
        {me && <pre style={{background:"#0b0f13",color:"#a7f3d0",padding:12,borderRadius:12}}>{JSON.stringify(me,null,2)}</pre>}
        <p className="note">You can add navigation to your app here.</p>
      </div>
    </div>
  );
}
