export default function Results({ data }) {
  if (!data?.length) return null;

  return (
    <div className="p-4">
      {data.map((r, i) => {
        let parsed;
try {
  let txt = r.llm_json;
  if (typeof txt !== "string") txt = JSON.stringify(txt);
  // 🧹 remove backticks and "json" code fences
  txt = txt.replace(/```json\s*|```/g, "").trim();
  parsed = JSON.parse(txt);
} catch (e) {
  console.error("Invalid JSON:", r.llm_json);
  parsed = { score: "?", highlights: [], missing: [] };
}


        return (
          <div key={i} className="mb-6 border p-3 rounded bg-gray-50 shadow-sm">
            <h2 className="text-xl font-bold text-blue-600">{r.candidate}</h2>
            <p className="font-semibold">Score: {parsed.score}</p>

            <h3 className="text-green-700 font-semibold mt-2">Highlights:</h3>
            <ul className="list-disc ml-6">
              {parsed.highlights?.map((h, j) => <li key={j}>{h}</li>)}
            </ul>

            <h3 className="text-red-700 font-semibold mt-2">Missing:</h3>
            <ul className="list-disc ml-6">
              {parsed.missing?.map((m, j) => <li key={j}>{m}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
