"use client";
import { useState, FormEvent, JSX } from "react";

interface SummaryResponse {
  summary: string;
}

interface ErrorResponse {
  error: string;
}

function Summarizer(): JSX.Element {
  const [text, setText] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [maxWords, setMaxWords] = useState<number>(50);
  const [summaryStyle, setSummaryStyle] = useState<string>("neutral");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, maxWords, summaryStyle }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(
          errorData.error || "An error occurred during summarization."
        );
      }

      const data: SummaryResponse = await response.json();
      setSummary(data.summary);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
            Texto
          </h1>
          <p className="text-gray-600 text-center">
            Summarize your text quickly and easily with AI.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="maxWords"
              className="block text-gray-700 font-medium mb-2"
            >
              Maximum number of words:
            </label>
            <input
              type="number"
              id="maxWords"
              className="w-full md:w-1/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              value={maxWords}
              onChange={(e) => setMaxWords(Number(e.target.value))}
            />
          </div>

          {/* Need to implement select later */}
          {/* <div className="mb-4">
            <label
              htmlFor="summaryStyle"
              className="block text-gray-700 font-medium mb-2"
            >
              Summary Style/Tone:
            </label>
            <select
              id="summaryStyle"
              className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={summaryStyle}
              onChange={(e) => setSummaryStyle(e.target.value)}
            >
              <option value="neutral">Neutral</option>
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
              <option value="bullet-points">Bullet Points</option>
              <option value="single-paragraph">Single Paragraph</option>
              <option value="original-text-order">Original Text Order</option>
            </select>
          </div> */}

          <div className="mb-4">
            <label
              htmlFor="text"
              className="block text-gray-700 font-medium mb-2"
            >
              Enter text here:
            </label>
            <textarea
              id="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to summarize"
            />
          </div>

          <div className="text-center">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Summarizing..." : "Summarize"}
            </button>
          </div>
        </form>

        {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

        {summary && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Summary:
            </h2>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              defaultValue={summary}
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Summarizer;
