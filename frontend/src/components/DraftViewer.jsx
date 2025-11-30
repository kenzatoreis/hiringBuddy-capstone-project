// src/components/DraftViewer.jsx
import { useMemo } from "react";
import Btn from "./ui/Btn";
import {Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import axios from "axios";

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
        return {
          sections: Object.entries(parsed).map(([title, content]) => ({
            title,
            content,
          })),
        };
    }
    if (typeof draft === "object")
      return {
        sections: Object.entries(draft).map(([title, content]) => ({
          title,
          content,
        })),
      };
  } catch (e) {
    console.error("Cannot parse draft", e);
  }
  return { sections: [] };
}

// render multiline string as <p> lines
function renderTextBlock(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/).filter(Boolean);
  return lines.map((ln, i) => (
    <p key={i} className="whitespace-pre-line text-sm">
      {ln}
    </p>
  ));
}

// markdown serializer that understands the Skills object shape
function toMarkdown(sections) {
  return sections
    .map((s) => {
      if (
        s.title?.toLowerCase() === "skills" &&
        s.content &&
        typeof s.content === "object" &&
        (Array.isArray(s.content.all_from_resume) ||
          Array.isArray(s.content.jd_relevant_emphasis))
      ) {
        const all = s.content.all_from_resume || [];
        const em = s.content.jd_relevant_emphasis || [];
        return [
          `## ${s.title}`,
          ``,
          `### JD-Relevant (emphasis)`,
          ...em.map((x) => `- ${x}`),
          ``,
          `### All skills (from resume)`,
          ...all.map((x) => `- ${x}`),
          ``,
        ].join("\n");
      }
      return `## ${s.title}\n\n${
        typeof s.content === "string"
          ? s.content
          : JSON.stringify(s.content, null, 2)
      }\n`;
    })
    .join("\n");
}

// build docx content from your existing sections
function buildDocxParagraphs(sections) {
  const paras = [];

  sections.forEach((s) => {
    const title = s.title || "";

    // section title
    paras.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      })
    );

    const isSkillsObj =
      s.title?.toLowerCase() === "skills" &&
      s.content &&
      typeof s.content === "object" &&
      (Array.isArray(s.content.all_from_resume) ||
        Array.isArray(s.content.jd_relevant_emphasis));

    if (isSkillsObj) {
      const em = s.content.jd_relevant_emphasis || [];
      const all = s.content.all_from_resume || [];

      if (em.length) {
        paras.push(
          new Paragraph({
            text: "JD-Relevant (emphasis)",
            heading: HeadingLevel.HEADING_3,
          })
        );
        em.forEach((item) => {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({ text: "• ", bold: true }),
                new TextRun(item),
              ],
            })
          );
        });
        paras.push(new Paragraph({ text: "" }));
      }

      if (all.length) {
        paras.push(
          new Paragraph({
            text: "All skills (from resume)",
            heading: HeadingLevel.HEADING_3,
          })
        );
        all.forEach((item) => {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({ text: "• ", bold: true }),
                new TextRun(item),
              ],
            })
          );
        });
        paras.push(new Paragraph({ text: "" }));
      }
    } else {
      const text =
        typeof s.content === "string"
          ? s.content
          : JSON.stringify(s.content, null, 2);
      const lines = String(text).split(/\r?\n/);

      lines.forEach((ln) => {
        paras.push(new Paragraph(ln));
      });
      paras.push(new Paragraph({ text: "" }));
    }
  });

  return paras;
}

export default function DraftViewer({ draft, fullName }) {
  const normalized = useMemo(() => parseDraft(draft), [draft]);
  const sections = normalized.sections || [];

  if (!sections.length)
    return <p className="text-gray-500">No sections returned.</p>;

  const copy = async () => {
    await navigator.clipboard.writeText(toMarkdown(sections));
    alert("Draft copied as Markdown.");
  };

  //download as DOCX instead of markdown
  // const downloadDocx = async () => {
  //   try {
  //     const paragraphs = buildDocxParagraphs(sections);

  //     const doc = new Document({
  //       sections: [
  //         {
  //           properties: {},
  //           children: paragraphs,
  //         },
  //       ],
  //     });

  //     const blob = await Packer.toBlob(doc);
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "cv_draft.docx";
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   } catch (e) {
  //     console.error("DOCX export error", e);
  //     alert("Could not generate DOCX file.");
  //   }
  // };
  const downloadDocx = async () => {
    try {
      // You can later pass real name & contact via props
      const payload = {
        full_name:  fullName || "Your Name", // or from props / profile
        contact: {
          phone: "",
          email: "",
          location: "",
          linkedin: "",
        },
        sections: sections.map((s) => ({
          title: s.title || "",
          // backend will accept both strings and objects, but let's stringify non-strings
          content:
            typeof s.content === "string"
              ? s.content
              : JSON.stringify(s.content ?? "", null, 2),
        })),
      };

      const res = await axios.post(
        "http://127.0.0.1:8000/ai/cv_docx_download",
        payload,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "HiringBuddy_CV.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("DOCX export error", e);
      alert("Could not generate DOCX file.");
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-brand-700">Generated CV Draft</h3>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={copy}>
            Copy
          </Btn>
          <button
            onClick={downloadDocx}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-green-600 transition"
          >
            Download DOCX
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((s, i) => {
          const isSkillsObj =
            s.title?.toLowerCase() === "skills" &&
            s.content &&
            typeof s.content === "object" &&
            (Array.isArray(s.content.all_from_resume) ||
              Array.isArray(s.content.jd_relevant_emphasis));

          return (
            <div key={i} className="border rounded-lg bg-gray-50">
              <div className="px-4 py-3 border-b bg-gray-100 rounded-t-lg">
                <h4 className="font-semibold text-brand-800">{s.title}</h4>
              </div>
              {/* SCROLLABLE CONTENT AREA */}
              <div
                className="p-4"
                style={{ maxHeight: 420, overflowY: "auto" }}
              >
                {isSkillsObj ? (
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-semibold mb-1">
                        JD-Relevant (emphasis)
                      </h5>
                      {(s.content.jd_relevant_emphasis || []).length ? (
                        <ul className="list-disc ml-5">
                          {(s.content.jd_relevant_emphasis || []).map(
                            (item, idx) => (
                              <li key={idx} className="text-sm">
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">
                          No JD-specific emphasis found.
                        </p>
                      )}
                    </div>
                    <div className="border-t pt-2">
                      <h5 className="text-sm font-semibold mb-1">
                        All skills (from resume)
                      </h5>
                      {(s.content.all_from_resume || []).length ? (
                        <ul className="list-disc ml-5">
                          {(s.content.all_from_resume || []).map(
                            (item, idx) => (
                              <li key={idx} className="text-sm">
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">
                          No skills detected in resume.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="leading-relaxed">
                    {renderTextBlock(s.content)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
