// // src/components/SuggestionsCard.jsx
// import { useEffect, useState, useCallback } from "react";
// import Btn from "./ui/Btn";
// import { getSuggestions } from "../api";

// export default function SuggestionsCard({ resumeText, jdText, missing, language = "en" }) {
//   const [suggestions, setSuggestions] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const fetchedRef = useRef(false);
//   const fetchSuggestions = useCallback(async () => {
//     // don’t spam if already loading
//     if (loading) return;

//     if (!resumeText || !jdText) {
//       setError("Missing resume or job description for suggestions.");
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const res = await getSuggestions(resumeText, jdText, missing, language);
//       const payload = res.data || {};

//       // backend now always returns this shape
//       const safe = payload.suggestions || {
//         certificates: [],
//         projects: [],
//         skills_to_learn: [],
//         note: "",
//       };

//       setSuggestions(safe);

//       // if backend used ok: false, we still show the note but you can also surface a msg
//       if (payload.ok === false && !safe.note) {
//         setError("AI is temporarily unavailable. Please try again in a moment.");
//       }
//     } catch (err) {
//       console.error("Error fetching suggestions:", err);
//       const status = err?.response?.status;

//       if (status === 504) {
//         setError("The AI took too long to respond. Please try again in a few seconds.");
//       } else if (status === 500 || status === 502 || status === 503) {
//         setError("The AI service is temporarily unavailable. Try again shortly.");
//       } else {
//         setError("Could not fetch suggestions.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [resumeText, jdText, missing, language, loading]);

//   // Auto-load once when we *first* have missing skills
//   useEffect(() => {
//     if (missing?.length > 0 && !suggestions) {
//       fetchSuggestions();
//     }
//   }, [missing, suggestions, fetchSuggestions]);

//   if (loading) return <div className="card">Analyzing profile...</div>;
//   if (!suggestions && !error) return null;

//   const {
//     certificates = [],
//     projects = [],
//     skills_to_learn = [],
//     note = "",
//   } = suggestions || {};

//   return (
//     <div className="card bg-amber-50 border-amber-200 space-y-3">
//       <h3 className="text-xl font-bold text-amber-700">AI Career Suggestions 🧭</h3>

//       {error && (
//         <p className="text-sm text-red-600">
//           {error}
//         </p>
//       )}

//       {suggestions && (
//         <>
//           <div className="grid md:grid-cols-3 gap-4">
//             <div>
//               <h4 className="font-semibold text-amber-800 mb-1">📜 Recommended Certificates</h4>
//               <ul className="list-disc ml-5 text-sm">
//                 {certificates.map((c, i) => <li key={i}>{c}</li>)}
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold text-amber-800 mb-1">💡 Project Ideas</h4>
//               <ul className="list-disc ml-5 text-sm">
//                 {projects.map((p, i) => <li key={i}>{p}</li>)}
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold text-amber-800 mb-1">⚙️ Skills to Learn</h4>
//               <ul className="list-disc ml-5 text-sm">
//                 {skills_to_learn.map((s, i) => <li key={i}>{s}</li>)}
//               </ul>
//             </div>
//           </div>

//           {note && (
//             <p className="italic text-sm text-amber-700">{note}</p>
//           )}
//         </>
//       )}

//       <div className="text-right">
//         <Btn variant="ghost" onClick={fetchSuggestions}>
//           ↻ Refresh
//         </Btn>
//       </div>
//     </div>
//   );
// }
// src/components/SuggestionsCard.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import Btn from "./ui/Btn";
import { getSuggestions } from "../api";

export default function SuggestionsCard({
  resumeText,
  jdText,
  missing,
  language = "en",
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 👇 track if we've already auto-fetched once
  const fetchedRef = useRef(false);

  const fetchSuggestions = useCallback(
    async () => {
      // don’t spam if already loading
      if (loading) return;

      if (!resumeText?.trim() || !jdText?.trim()) {
        setError("Missing resume or job description for suggestions.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await getSuggestions(resumeText, jdText, missing, language);
        const payload = res.data || {};

        // backend now always returns this shape
        const safe = payload.suggestions || {
          certificates: [],
          projects: [],
          skills_to_learn: [],
          note: "",
        };

        setSuggestions(safe);

        // if backend used ok: false, we still show the note but you can also surface a msg
        if (payload.ok === false && !safe.note) {
          setError("AI is temporarily unavailable. Please try again in a moment.");
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        const status = err?.response?.status;

        if (status === 504) {
          setError("The AI took too long to respond. Please try again in a few seconds.");
        } else if (status === 500 || status === 502 || status === 503) {
          setError("The AI service is temporarily unavailable. Try again shortly.");
        } else {
          setError("Could not fetch suggestions.");
        }
      } finally {
        setLoading(false);
      }
    },
    [resumeText, jdText, missing, language, loading]
  );

  // 🔁 Auto-load ONCE when we FIRST have missing skills + CV + JD
  useEffect(() => {
    if (!missing?.length) return;
    if (!resumeText?.trim() || !jdText?.trim()) return;

    // already auto-fetched once? do nothing
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchSuggestions();
  }, [missing, resumeText, jdText, fetchSuggestions]);

  if (loading) return <div className="card">Analyzing profile...</div>;
  if (!suggestions && !error) return null;

  const {
    certificates = [],
    projects = [],
    skills_to_learn = [],
    note = "",
  } = suggestions || {};

  return (
    <div className="card bg-amber-50 border-amber-200 space-y-3">
      <h3 className="text-xl font-bold text-amber-700">AI Career Suggestions 🧭</h3>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {suggestions && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">
                📜 Recommended Certificates
              </h4>
              <ul className="list-disc ml-5 text-sm">
                {certificates.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">💡 Project Ideas</h4>
              <ul className="list-disc ml-5 text-sm">
                {projects.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">⚙️ Skills to Learn</h4>
              <ul className="list-disc ml-5 text-sm">
                {skills_to_learn.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {note && <p className="italic text-sm text-amber-700">{note}</p>}
        </>
      )}

      <div className="text-right">
        <Btn variant="ghost" onClick={fetchSuggestions} disabled={loading}>
          ↻ Refresh
        </Btn>
      </div>
    </div>
  );
}
