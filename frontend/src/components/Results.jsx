// src/components/Results.jsx
export default function Results({ data, showScore = true }) {
  if (!data?.length) return <p className="text-gray-500">No results yet.</p>;

  return (
    <div className="space-y-4">
      {data.map((r, i) => {
        let parsed;
        try {
          let txt = r.llm_json;
          if (typeof txt !== "string") txt = JSON.stringify(txt);
          txt = txt.replace(/```json\s*|```/g, "").trim();
          parsed = JSON.parse(txt);
        } catch {
          parsed = { score: "?", highlights: [], missing: [] };
        }

        return (
          <div key={i} className="card bg-brand-50/40 border-brand-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-brand-800">{r.candidate}</h3>
                            {showScore && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-brand-500 text-white text-xs">
                  Score: {parsed.score}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div>
                <h4 className="text-sm font-semibold text-brand-700 mb-1">Highlights</h4>
                <ul className="list-disc ml-5 text-sm">
                  {parsed.highlights?.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-700 mb-1">Missing</h4>
                <ul className="list-disc ml-5 text-sm">
                  {parsed.missing?.map((m, j) => <li key={j}>{m}</li>)}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
