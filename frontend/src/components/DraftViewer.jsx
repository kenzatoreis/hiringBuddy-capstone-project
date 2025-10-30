// src/components/DraftViewer.jsx
// import { useMemo } from "react";

// function parseDraft(draft) {
//   // Accepts shapes:
//   //  - { sections: [...] }
//   //  - { raw: "```json ... ```" }
//   //  - dict of {title: content}
//   try {
//     if (!draft) return { sections: [] };
//     if (draft.sections) return draft;

//     if (draft.raw) {
//       const cleaned = draft.raw.replace(/```json|```/g, "").trim();
//       const parsed = JSON.parse(cleaned);
//       if (parsed.sections) return parsed;
//       if (Array.isArray(parsed)) return { sections: parsed };
//       if (typeof parsed === "object") {
//         return {
//           sections: Object.entries(parsed).map(([title, content]) => ({ title, content })),
//         };
//       }
//     }
//     if (typeof draft === "object") {
//       return {
//         sections: Object.entries(draft).map(([title, content]) => ({ title, content })),
//       };
//     }
//   } catch (e) {
//     console.error("Cannot parse draft", e);
//   }
//   return { sections: [] };
// }

// // simple content formatter: bullets + linebreaks
// function renderContent(text) {
//   if (!text) return null;
//   const lines = text.split(/\r?\n/).filter(Boolean);

//   const blocks = [];
//   let list = null;

//   const flushList = () => {
//     if (list && list.length) {
//       blocks.push(
//         <ul className="list-disc ml-6" key={`ul-${blocks.length}`}>
//           {list.map((li, i) => <li key={i}>{li}</li>)}
//         </ul>
//       );
//       list = null;
//     }
//   };

//   lines.forEach((ln) => {
//     const m = ln.match(/^\s*(?:•|-|\*)\s+(.*)$/);
//     if (m) {
//       if (!list) list = [];
//       list.push(m[1]);
//     } else {
//       flushList();
//       blocks.push(<p className="whitespace-pre-line" key={`p-${blocks.length}`}>{ln}</p>);
//     }
//   });
//   flushList();
//   return blocks;
// }

// function toMarkdown(sections) {
//   return sections
//     .map(s => `## ${s.title}\n\n${s.content}\n`)
//     .join("\n");
// }

// export default function DraftViewer({ draft }) {
//   const normalized = useMemo(() => parseDraft(draft), [draft]);
//   const sections = normalized.sections || [];

//   if (!sections.length) {
//     return <p className="text-gray-500 mt-2">No sections returned.</p>;
//   }

//   const handleCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(toMarkdown(sections));
//       alert("Draft copied as Markdown.");
//     } catch {
//       alert("Could not copy.");
//     }
//   };

//   const handleDownload = () => {
//     const blob = new Blob([toMarkdown(sections)], { type: "text/markdown;charset=utf-8" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "cv_draft.md";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="mt-6 border-t pt-4">
//       <div className="flex items-center gap-2 mb-3">
//         <h3 className="text-xl font-bold text-purple-700 flex-1">Generated CV Draft</h3>
//         <button onClick={handleCopy} className="px-3 py-1 rounded border">Copy MD</button>
//         <button onClick={handleDownload} className="px-3 py-1 rounded border">Download MD</button>
//       </div>

//       <div className="space-y-4">
//         {sections.map((s, i) => (
//           <div key={i} className="bg-white border rounded shadow-sm p-4">
//             <h4 className="font-semibold text-lg mb-2">{s.title}</h4>
//             <div className="text-sm leading-6">{renderContent(s.content)}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
// src/components/DraftViewer.jsx
import { useMemo } from "react";
import Btn from "./ui/Btn";

function parseDraft(draft) {
  try {
    if (!draft) return { sections: [] };
    if (draft.sections) return draft;
    if (draft.raw) {
      const cleaned = draft.raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.sections) return parsed;
      if (Array.isArray(parsed)) return { sections: parsed };
      if (typeof parsed === "object") {
        return { sections: Object.entries(parsed).map(([title, content]) => ({ title, content })) };
      }
    }
    if (typeof draft === "object") {
      return { sections: Object.entries(draft).map(([title, content]) => ({ title, content })) };
    }
  } catch (e) { console.error("Cannot parse draft", e); }
  return { sections: [] };
}

function renderContent(text) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).filter(Boolean);
  const blocks = []; let list = null;
  const flushList = () => {
    if (list?.length) {
      blocks.push(<ul className="list-disc ml-6" key={`ul-${blocks.length}`}>{list.map((li, i) => <li key={i}>{li}</li>)}</ul>);
      list = null;
    }
  };
  lines.forEach((ln) => {
    const m = ln.match(/^\s*(?:•|-|\*)\s+(.*)$/);
    if (m) { (list ||= []).push(m[1]); }
    else { flushList(); blocks.push(<p className="whitespace-pre-line" key={`p-${blocks.length}`}>{ln}</p>); }
  });
  flushList();
  return blocks;
}

function toMarkdown(sections) {
  return sections.map(s => `## ${s.title}\n\n${s.content}\n`).join("\n");
}

export default function DraftViewer({ draft }) {
  const normalized = useMemo(() => parseDraft(draft), [draft]);
  const sections = normalized.sections || [];
  if (!sections.length) return <p className="text-gray-500">No sections returned.</p>;

  const copy = async () => {
    await navigator.clipboard.writeText(toMarkdown(sections));
    alert("Draft copied as Markdown.");
  };
  const download = () => {
    const blob = new Blob([toMarkdown(sections)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "cv_draft.md"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xl font-bold text-brand-700 flex-1">Generated CV Draft</h3>
        <button onClick={copy} className="btn-ghost">Copy</button>
        <button onClick={download} className="btn-ghost">Download</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((s, i) => (
          <div key={i} className="bg-white border border-brand-100 rounded-xl2 shadow-soft p-4">
            <h4 className="font-semibold text-lg text-brand-800 mb-2">{s.title}</h4>
            <div className="text-sm leading-6">{renderContent(s.content)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
