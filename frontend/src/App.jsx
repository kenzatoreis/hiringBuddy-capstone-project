import { useState } from "react";
import FileUpload from "./components/FileUpload";
import Results from "./components/Results";

export default function App() {
  const [results, setResults] = useState([]);
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-center mb-4">HiringBuddy Match</h1>
      <FileUpload onResults={setResults} />
      <Results data={results} />
    </div>
  );
}
