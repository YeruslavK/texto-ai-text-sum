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
    <div>
      <div className="filter-settings-div">
        <span>Maximum number of words: </span>{" "}
        <input
          type="number"
          className="max-words-input"
          min={1}
          value={maxWords}
          onChange={(e) => setMaxWords(Number(e.target.value))}
        />
        , <span>Summary Style/Tone:</span>{" "}
        <select
          value={summaryStyle}
          onChange={(e) => setSummaryStyle(e.target.value)}
        >
          <option value="neutral">Neutral</option>
          <option value="formal">Formal</option>
          <option value="informal">Informal</option>
          <option value="bullet-points">Bullet Points</option>
          <option value="single-paragraph">Single Paragraph</option>
          <option value="original-text-order">Original Text Order</option>
        </select>{" "}
        <br />
      </div>{" "}
      <br />
      <form onSubmit={handleSubmit}>
        <div className="user-text-div">
          <span>Enter text here and</span>{" "}
          <button className="sum-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Summarizing..." : "Summarize!"}
          </button>
          <br />
          <textarea
            className="user-text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to summarize"
          />{" "}
        </div>
      </form>{" "}
      <br />
      {error && <div style={{ color: "red" }}>{error}</div>}
      {summary && (
        <div className="user-text-div">
          <h2>Summary:</h2>
          <textarea
            className="summarize-text-output"
            defaultValue={summary}
            disabled
          ></textarea>
        </div>
      )}
    </div>
  );
}

export default Summarizer;
