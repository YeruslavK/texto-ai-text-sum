"use client";
import { useState } from "react";

export default function Home() {
  return (
    <>
      <h1 className="title-head">Texto</h1>
      <h3 className="sub-title-head">summarize text with AI</h3> <br />
      <div className="filter-settings-div">
        <span>Max Lines: </span>{" "}
        <input type="number" className="max-lines-input" />,{" "}
        <span>Summary Style/Tone:</span>{" "}
        <select>

          <option value="neutral">Neutral</option>
          <option value="formal">Formal</option>
          <option value="informal">Informal</option>
          <option value="bullet-points">Bullet Points</option>
          <option value="single-paragraph">Single Paragraph</option>
          <option value="original-text-order">Original Text Order</option>
        </select>{" "}
        <br />
        <button className="sum-btn">Summarize!</button>

      </div>{" "}
      <br />
      <div className="user-text-div">
        <span>Enter text here</span> <br />
        <textarea className="user-text-input" />{" "}
      </div>
    </>
  );
}
