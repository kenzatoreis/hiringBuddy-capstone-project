import React, { useEffect, useRef, useState } from "react";
import { apiJson, apiForm } from "../api";

const TXT_HEAD = 1200; // preview head length

function Button({ className = "", ...props }) {
  return <button {...props} className={`px-3 py-2 rounded-xl border text-sm font-medium hover:shadow ${className}`} />;
}

function Card({ title, right, className = "", children }) {
  return (
    <div className={`rounded-2xl shadow-sm border border-gray-200 bg-white ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-base font-semibold">{title}</h3>
          <div>{right}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function DocumentsPane({ onPick }) {
  const [cvList, setCvList] = useState([]);
  const [jdList, setJdList] = useState([]);
  const [jdText, setJdText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function refresh() {
    const [cvs, jds] = await Promise.all([
      apiJson("/documents?type=cv"),
      apiJson("/documents?type=jd"),
    ]);
    setCvList(cvs);
    setJdList(jds);
  }

  useEffect(() => { refresh(); }, []);

  async function onUploadCV(e) {
    e.preventDefault();
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("type", "cv");
      fd.append("file", f);
      await apiForm("/documents/upload", fd);
      await refresh();
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      alert(err.message || String(err));
    } finally { setUploading(false); }
  }

  async function onSaveJD() {
    if (!jdText.trim()) return;
    setUploading(true);
    try {
      await apiJson("/documents/upload_text", {
        method: "POST",
        body: JSON.stringify({ type: "jd", text: jdText }),
      });
      setJdText("");
      await refresh();
    } catch (err) {
      alert(err.message || String(err));
    } finally { setUploading(false); }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Upload CV (PDF/DOCX/TXT)">
        <form onSubmit={onUploadCV} className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="block w-full text-sm" />
          <Button type="submit" className="bg-black text-white" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </form>

        <div className="mt-3">
          <h4 className="text-sm font-medium mb-1">Your CVs</h4>
          <ul className="space-y-1">
            {cvList.map((cv) => (
              <li key={cv.id} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[70%]">#{cv.id} {cv.filename || "(pasted text)"}</span>
                <Button className="hover:bg-gray-50" onClick={() => onPick(cv)}>Pick</Button>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title="Paste Job Description (JD)">
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste JD text here…"
          className="w-full h-40 border rounded-xl p-3 text-sm focus:outline-none focus:ring"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={onSaveJD} className="bg-black text-white" disabled={uploading || !jdText.trim()}>
            {uploading ? "Saving…" : "Save JD"}
          </Button>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium mb-1">Your JDs</h4>
          <ul className="space-y-1">
            {jdList.map((jd) => (
              <li key={jd.id} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[70%]">#{jd.id} {jd.filename || "(pasted text)"}</span>
                <Button className="hover:bg-gray-50" onClick={() => onPick(jd)}>Pick</Button>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}

function ComparePane({ cv, jd }) {
  const [running, setRunning] = useState(false);
  const [out, setOut] = useState(null);

  async function runCompare() {
    if (!cv || !jd) return;
    setRunning(true);
    try {
      const res = await apiJson("/compare", {
        method: "POST",
        body: JSON.stringify({ cv_id: cv.id, jd_id: jd.id }),
      });
      setOut(res);
    } catch (err) {
      alert(err.message || String(err));
    } finally { setRunning(false); }
  }

  return (
    <Card title="CV ↔ JD Match" right={<span className="text-sm text-gray-500">Pick a CV + JD, then Compare</span>}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`px-2 py-1 rounded-full border ${cv ? "border-green-500" : "border-gray-300"}`}>
          CV: {cv ? `#${cv.id}` : "none"}
        </span>
        <span className={`px-2 py-1 rounded-full border ${jd ? "border-blue-500" : "border-gray-300"}`}>
          JD: {jd ? `#${jd.id}` : "none"}
        </span>
        <Button onClick={runCompare} className="bg-black text-white ml-auto" disabled={!cv || !jd || running}>
          {running ? "Comparing…" : "Run Compare"}
        </Button>
      </div>

      {out && (
        <div className="mt-4 grid md:grid-cols-4 gap-4">
          <Card title="Score" className="md:col-span-1">
            <div className="text-4xl font-bold">{out.score}</div>
            <p className="text-sm text-gray-500 mt-2">{out.summary}</p>
          </Card>

          <Card title="Highlights" className="md:col-span-1">
            <ul className="list-disc pl-5 text-sm space-y-1">
              {(out.highlights || []).map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </Card>

          <Card title="Missing" className="md:col-span-1">
            <ul className="list-disc pl-5 text-sm space-y-1">
              {(out.missing || []).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </Card>

          <Card title="Evidence" className="md:col-span-1">
            <ol className="list-decimal pl-5 text-xs space-y-2">
              {(out.evidence || []).map((e, i) => (
                <li key={i}><pre className="whitespace-pre-wrap">{e.snippet?.slice(0, TXT_HEAD)}</pre></li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </Card>
  );
}

export default function AIWorkspace() {
  const [pickedCV, setPickedCV] = useState(null);
  const [pickedJD, setPickedJD] = useState(null);

  function onPick(doc) {
    if (doc.type === "cv") setPickedCV(doc);
    else setPickedJD(doc);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black" />
            <span className="font-semibold">HiringBuddy · AI Workspace</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Documents</h2>
          <DocumentsPane onPick={onPick} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Compare</h2>
          <ComparePane cv={pickedCV} jd={pickedJD} />
        </section>
      </main>
    </div>
  );
}
