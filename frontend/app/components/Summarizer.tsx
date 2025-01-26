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
  const [length, setLength] = useState<string>("medium");
  const [temperature, setTemperature] = useState<number>(1.0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSummary("");

    try {
      const response = await fetch("http://127.0.0.1:8000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, maxWords, length, temperature }),
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
              htmlFor="length"
              className="block text-gray-700 font-medium mb-2"
            >
              Summary Length:
            </label>
            <select
              id="length"
              className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="mb-4">
            <label
              htmlFor="temperature"
              className="block text-gray-700 font-medium mb-2"
            >
              Temperature (0.0 - 2.0):
            </label>
            <input
              type="range"
              id="temperature"
              min="0.0"
              max="2.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <output htmlFor="temperature" className="text-gray-700">
              {temperature}
            </output>
          </div>

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
              value={summary}
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Summarizer;
