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
      if (typeof parsed === "object")
        return { sections: Object.entries(parsed).map(([title, content]) => ({ title, content })) };
    }
    if (typeof draft === "object")
      return { sections: Object.entries(draft).map(([title, content]) => ({ title, content })) };
  } catch (e) {
    console.error("Cannot parse draft", e);
  }
  return { sections: [] };
}

function renderContent(text) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.map((ln, i) => <p key={i} className="whitespace-pre-line text-sm">{ln}</p>);
}

function toMarkdown(sections) {
  return sections.map((s) => `## ${s.title}\n\n${s.content}\n`).join("\n");
}

export default function DraftViewer({ draft }) {
  const normalized = useMemo(() => parseDraft(draft), [draft]);
  const sections = normalized.sections || [];

  if (!sections.length)
    return <p className="text-gray-500">No sections returned.</p>;

  const copy = async () => {
    await navigator.clipboard.writeText(toMarkdown(sections));
    alert("Draft copied as Markdown.");
  };

  const download = () => {
    const blob = new Blob([toMarkdown(sections)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cv_draft.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-brand-700">Generated CV Draft</h3>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={copy}>Copy</Btn>
          <Btn variant="ghost" onClick={download}>Download</Btn>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((s, i) => (
          <div key={i} className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-brand-800 mb-2">{s.title}</h4>
            <div className="leading-relaxed">{renderContent(s.content)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
