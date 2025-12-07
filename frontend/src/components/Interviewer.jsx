// src/components/Interviewer.jsx
import { useState } from "react";
import { getInterviewQuestions, evaluateInterview } from "../api";
import Btn from "./ui/Btn";
export default function Interviewer({ resumeText, jdText, language = "en" }) {
  const [role, setRole] = useState("");
  const [loadingQs, setLoadingQs] = useState(false);
  const [qs, setQs] = useState([]);

  const [answers, setAnswers] = useState({});      // { [id]: "answer text" }
  const [evalLoading, setEvalLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const cvOk = Boolean(resumeText?.trim());
  const jdOk = Boolean(jdText?.trim());

  // ---------- Generate questions ----------
  const generate = async () => {
    if (!jdText?.trim()) {
      alert("Please upload or enter a Job Description first.");
      return;
    }
    setLoadingQs(true);
    setEvaluation(null); // clear previous evaluation
    try {
      const res = await getInterviewQuestions({
        resume_text: resumeText || "",
        jd_text: jdText || "",
        target_role: role || undefined,
        language: language || "en",
      });

      const list = res.data.questions || [];
      // 
      // const limited = list.slice(0, 4);

      setQs(list);

      // initialize empty answers
      const init = {};
      for (const q of list) {
        init[q.id] = "";
      }
      setAnswers(init);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Could not generate interview questions.";
      alert(msg);
    } finally {
      setLoadingQs(false);
    }
  };

  // ---------- Update answer ----------
  const handleChangeAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // ---------- Evaluate answers ----------
const handleEvaluate = async () => {
  if (!qs.length) {
    alert("Generate questions first.");
    return;
  }

  const payloadAnswers = qs.map((q) => ({
    id: q.id,
    category: q.category,
    question: q.text,
    answer: answers[q.id] || "",
  }));

  setEvalLoading(true);
  try {
    const res = await evaluateInterview({
      jd_text: jdText || "",
      answers: payloadAnswers,
      language: language || "en",   // 🔹 include language here
    });

    // backend returns { ok: true, evaluation: { ... } }
    const evalObj = res.data.evaluation ?? res.data;
    console.log("INTERVIEW EVAL RESPONSE:", evalObj);
    setEvaluation(evalObj);
  } catch (e) {
    console.error(e);
    const msg =
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      "Could not evaluate your answers.";
    alert(msg);
  } finally {
    setEvalLoading(false);
  }
};

//     const res = await evaluateInterview({
//   jd_text: jdText || "",
//   answers: payloadAnswers,
// });

// // backend returns { ok: true, evaluation: { ... } }
// const evalObj = res.data.evaluation ?? res.data;
// console.log("INTERVIEW EVAL RESPONSE:", evalObj);  // <--- ADD THIS
// setEvaluation(evalObj);

  // };

  // convenience: final score number
  const finalScore =
    evaluation && evaluation.final && evaluation.final.final_score != null
      ? evaluation.final.final_score
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="section-title">Interviewer Agent</h2>
        <div className="text-xs text-gray-600">
          Using uploads: <b>CV</b> {cvOk ? "✓" : "—"} • <b>JD</b> {jdOk ? "✓" : "—"}
        </div>
      </div>

      {/* Role input */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Target role (optional)</label>
          <input
            className="input"
            placeholder="e.g., Software Engineer Intern"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </div>

      {/* Generate questions */}
      <Btn
        type="button"
        onClick={generate}
        disabled={loadingQs || !jdOk}
      >
        {loadingQs ? "Generating…" : "Generate Questions"}
      </Btn>
      <Btn
        type="button"
        onClick={generate}
        disabled={loadingQs}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Refresh Questions
      </Btn>


      {/* Questions + answer textareas */}
      {qs.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {qs.map((q, i) => (
              <div key={q.id} className="rounded-lg border p-3 bg-gray-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                    {q.category}
                  </span>
                  <span className="text-xs text-gray-500">Q{i + 1}</span>
                </div>
                <p className="text-sm font-semibold">{q.text}</p>
                <textarea
                  rows={3}
                  className="textarea mt-1"
                  placeholder="Type your answer here…"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleChangeAnswer(q.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Evaluate button */}
          <div className="flex justify-end">
            <div className="flex justify-end">
            <Btn
              type="button"
              onClick={handleEvaluate}
              disabled={evalLoading}
            >
              {evalLoading ? "Evaluating…" : "Evaluate my answers"}
            </Btn>
          </div>

          </div>
        </div>
      )}

      {/* Evaluation output */}
      {evaluation && (
        <div className="mt-6 space-y-6">
          {/* Final score card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">Overall Interview Score</h3>
            <p className="text-4xl font-extrabold">
              {finalScore !== null ? `${finalScore}%` : "—"}
            </p>

            {evaluation.final?.strengths?.length > 0 && (
              <ul className="mt-3 text-sm list-disc list-inside text-emerald-50">
                {evaluation.final.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Per-question feedback */}
          <div className="space-y-4">
            {(evaluation.per_question || []).map((item) => {
              const q = qs.find((qq) => qq.id === item.id);
              return (
                <div key={item.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {q?.category?.toUpperCase()} – {q?.text}
                    </h4>
                    <span className="text-sm font-bold text-green-700">
                      {item.score}/5
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Your answer:</span>{" "}
                    {answers[item.id] || <em>(no answer)</em>}
                  </p>
                  {item.feedback && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Feedback:</span>{" "}
                      {item.feedback}
                    </p>
                  )}
                  {item.ideal_answer && (
                    <details className="text-sm text-gray-700 mt-1">
                      <summary className="cursor-pointer text-blue-600">
                        Show ideal answer
                      </summary>
                      <p className="mt-1">{item.ideal_answer}</p>
                    </details>
                  )}
                </div>
              );
            })}
          </div>

          {/* Improvement resources */}
          {evaluation.final && (
            <div className="bg-white rounded-xl shadow p-4">
              {evaluation.final.improvements?.length > 0 && (
                <>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Things to improve
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 mb-3">
                    {evaluation.final.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </>
              )}
              {evaluation.final.resources?.length > 0 && (
                <>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Suggested practice / resources
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {evaluation.final.resources.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
