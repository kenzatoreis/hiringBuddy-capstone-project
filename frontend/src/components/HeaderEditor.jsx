// import { useState } from "react";

// export default function HeaderEditor({ onGenerate }) {
//   const defaultHeaders = [
//     { title: "Profile", context: "(keep it brief)" },
//     { title: "Professional Experience", context: "" },
//     { title: "Education", context: "" },
//     { title: "Projects", context: "" },
//     { title: "Certificates", context: "" },
//     { title: "Skills", context: "" },
//     { title: "Languages", context: "" },
//   ];

//   const [headers, setHeaders] = useState(defaultHeaders);

//   const handleChange = (idx, field, value) => {
//     const copy = [...headers];
//     copy[idx][field] = value;
//     setHeaders(copy);
//   };

//   const addHeader = () => setHeaders([...headers, { title: "", context: "" }]);
//   const removeHeader = (i) => setHeaders(headers.filter((_, j) => j !== i));

//   return (
//     <div className="p-4 border rounded mt-4">
//       <h3 className="text-xl font-semibold mb-2">Suggested Headers</h3>
//       {headers.map((h, i) => (
//         <div key={i} className="mb-2 border p-2 rounded bg-gray-50">
//           <input
//             className="border px-2 py-1 w-full mb-1"
//             value={h.title}
//             onChange={(e) => handleChange(i, "title", e.target.value)}
//             placeholder="Header title"
//           />
//           <textarea
//             className="border px-2 py-1 w-full"
//             value={h.context}
//             onChange={(e) => handleChange(i, "context", e.target.value)}
//             placeholder="Optional context..."
//           />
//           <button
//             onClick={() => removeHeader(i)}
//             className="mt-1 text-sm text-red-600 hover:underline"
//           >
//             Remove
//           </button>
//         </div>
//       ))}
//       <button
//         onClick={addHeader}
//         className="mt-2 px-3 py-1 bg-gray-300 rounded"
//       >
//         + Add Header
//       </button>
//       <button
//         onClick={() => onGenerate(headers)}
//         className="ml-3 px-4 py-1 bg-purple-600 text-white rounded"
//       >
//         Generate Draft
//       </button>
//     </div>
//   );
// }
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
    const copy = [...headers]; copy[i][f] = v; setHeaders(copy);
  };
  const addHeader = () => setHeaders([...headers, { title: "", context: "" }]);
  const removeHeader = (i) => setHeaders(headers.filter((_, j) => j !== i));

  const generate = async () => {
    try { setBusy(true); await onGenerate(headers); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {headers.map((h, i) => (
        <div key={i} className="rounded-lg border p-3 bg-brand-50/40">
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
            placeholder="Optional context…"
          />
          <div className="mt-2 text-right">
            <button onClick={() => removeHeader(i)} className="text-brand-700 hover:text-brand-900 text-sm">
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={addHeader} className="btn-ghost">+ Add Header</button>
        <Btn onClick={generate} disabled={busy}>
        {busy ? "Generating…" : "Generate Draft"}
        </Btn>
      </div>
    </div>
  );
}
