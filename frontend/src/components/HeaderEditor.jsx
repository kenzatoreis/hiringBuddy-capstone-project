// src/components/HeaderEditor.jsx
import { useState } from "react";
import Btn from "./ui/Btn";

export default function HeaderEditor({ onGenerate }) {
  const defaultHeaders = [
    { title: "Profile", context: "(keep it brief)" },
    { title: "Professional Experience", context: "" },
    { title: "Education", context: "" },
    { title: "Projects", context: "" },
    { title: "Certificates", context: "" },
    { title: "Skills", context: "" },
    { title: "Languages", context: "" },
  ];
  const [headers, setHeaders] = useState(defaultHeaders);
  const [busy, setBusy] = useState(false);

  const handleChange = (i, f, v) => {
    const copy = [...headers];
    copy[i][f] = v;
    setHeaders(copy);
  };
  const addHeader = () => setHeaders([...headers, { title: "", context: "" }]);
  const removeHeader = (i) => setHeaders(headers.filter((_, j) => j !== i));

  const generate = async () => {
    try {
      setBusy(true);
      await onGenerate(headers);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-xl font-bold text-brand-700">CV Section Headers</h3>
      {headers.map((h, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <input
            className="input mb-2"
            value={h.title}
            onChange={(e) => handleChange(i, "title", e.target.value)}
            placeholder="Header title"
          />
          <textarea
            className="textarea"
            value={h.context}
            onChange={(e) => handleChange(i, "context", e.target.value)}
            placeholder="Optional context..."
          />
          <div className="text-right mt-2">
            <button
              onClick={() => removeHeader(i)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <Btn variant="ghost" onClick={addHeader}>
          + Add Header
        </Btn>
        <Btn onClick={generate} disabled={busy}>
          {busy ? "Generating..." : "Generate Draft"}
        </Btn>
      </div>
    </div>
  );
}
