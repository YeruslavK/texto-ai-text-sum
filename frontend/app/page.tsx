import Summarizer from "./components/Summarizer";

export default function Home() {
  return (
    <>
      <h1 className="title-head">Texto</h1>
      <h3 className="sub-title-head">Summarize text with AI</h3> <br />
      <Summarizer />
    </>
  );
}
