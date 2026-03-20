"use client";

import { useState, useEffect, useRef } from "react";
import "./globals.css";

const LANGUAGES = ["Auto Detect", "JavaScript", "Python", "Java", "C++", "TypeScript", "Go", "Rust"];

type Bug = { text: string; severity: "critical" | "warning" };


type RoastResult = {
  language: string;
  bugs: Bug[];
  improvements: string[];
  complexity: string;
  roast: string;
  grade: string;
};

function useTypingEffect(text: string, speed = 20) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return displayed;
}

const GRADES_DARK: Record<string, { color: string; label: string }> = {
  A: { color: "#00ff9d", label: "Clean Code" },
  B: { color: "#7ee8a2", label: "Pretty Good" },
  C: { color: "#febc2e", label: "Needs Work" },
  D: { color: "#ff8c42", label: "Yikes" },
  F: { color: "#ff4444", label: "Start Over" },
};


const GRADES_LIGHT: Record<string, { color: string; label: string }> = {
  A: { color: "#00a855", label: "Clean Code" },
  B: { color: "#16a34a", label: "Pretty Good" },
  C: { color: "#d97706", label: "Needs Work" },
  D: { color: "#ea580c", label: "Yikes" },
  F: { color: "#dc2626", label: "Start Over" },
};

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Auto Detect");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);
  const [dark, setDark] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);
  const typedRoast = useTypingEffect(result?.roast || "");
  const lineCount = code.split("\n").length;

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const GRADES = dark ? GRADES_DARK : GRADES_LIGHT;
  const grade = result?.grade?.toUpperCase().charAt(0) || "F";
  const gradeInfo = GRADES[grade] || GRADES["F"];

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    if (lineCount > 350) {
  setError("Too many lines! Please keep code under 350 lines for best results.");
  return;
}
    setLoading(true);
    setResult(null);
    setError("");
    setVisibleCards(0);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      [1, 2, 3, 4, 5].forEach((n) =>
        setTimeout(() => setVisibleCards(n), n * 200)
      );
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = [
      `RoastMyCode — Grade: ${result.grade}`,
      `Language: ${result.language}`,
      `\nBugs:\n${result.bugs.map(b => `[${b.severity.toUpperCase()}] ${b.text}`).join("\n")}`,
      `\nImprovements:\n${result.improvements.map(i => `• ${i}`).join("\n")}`,
      `\nComplexity:\n${result.complexity}`,
      `\nRoast:\n"${result.roast}"`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  

  return (
    <main>
      <header>
        <div className="header-left">
          <div className="traffic-lights">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="header-path">~/roastmycode</span>
        </div>
        <div className="header-right">
          <span className="version">v1.0.0</span>
          <button className="theme-toggle" onClick={() => setDark(!dark)}>
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
          <span className="status-dot" />
          <span className="status-text">ONLINE</span>
        </div>
      </header>

      <div className="container">
        <div className="hero">
          <p className="hero-tag">// AI Code Review</p>
          <h1>Roast<span className="accent">My</span>Code</h1>
          <p className="hero-sub">
            Paste your code. Get bugs, improvements, complexity — and a brutal roast.
            
          </p>
        </div>

        <div className="editor-wrapper">
          <div className="editor-toolbar">
            <div className="toolbar-left">
              <span className="filename">snippet.code</span>
              <span className="divider">|</span>
              <span className="linecount">{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
            </div>
            <select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="editor-body">
            <div className="line-numbers">
              {Array.from({ length: Math.max(lineCount, 14) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              className="code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// Paste your code here — no judgment, just consequences.

function calculateSum(a, b) {
  if (a = 0) return b; // this line is doing something… just not what you think
  return a + b
}

console.log(calculateSum(2)) // arguments are optional now? interesting`}
              spellCheck={false}
            />
          </div>
        </div>

         <p className="editor-hint">⚠ Best results with 20–350 lines of code</p>

        <div className="action-bar">
          <span className={`char-count ${lineCount > 350 ? "over-limit" : ""}`}>
  {code.length > 0 ? `${lineCount} / 350 lines` : "waiting for input..."}
</span>
          <button
            className={`analyze-btn ${loading || !code.trim() ? "disabled" : ""}`}
            onClick={handleAnalyze}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <span className="loading-text">
                <span className="spinner" />
                Analyzing...
              </span>
            ) : "⚡ Analyze & Roast"}
          </button>
        </div>

        {error && <div className="error-box">✗ {error}</div>}

        {result && (
          <div className="results" ref={resultRef}>

            {visibleCards >= 1 && (
              <div className="grade-row slide-up">
                <div className="grade-box" style={{
                  color: gradeInfo.color,
                  borderColor: gradeInfo.color + "44",
                  background: gradeInfo.color + "14",
                }}>
                  <span className="grade-letter">{grade}</span>
                  <span className="grade-label">{gradeInfo.label}</span>
                </div>
                <div className="grade-info">
                  <p className="detected-label">Language Detected</p>
                  <p className="detected-lang">{result.language}</p>
                  <p className="detected-meta">
                    {result.bugs.length} bug{result.bugs.length !== 1 ? "s" : ""} · {result.improvements.length} improvements
                  </p>
                </div>
              </div>
            )}

            {visibleCards >= 2 && (
              <div className="card slide-up">
                <div className="card-title red">
                  <span className="card-bar red-bg" />
                  01 / Bugs
                </div>
                {result.bugs.length === 0 ? (
                  <p className="empty-msg">No bugs found. Suspicious.</p>
                ) : (
                  <ul className="bug-list">
                    {result.bugs.map((bug, i) => (
                      <li key={i} className="bug-item">
                        <span className={`badge ${bug.severity === "critical" ? "badge-crit" : "badge-warn"}`}>
                          {bug.severity === "critical" ? "CRIT" : "WARN"}
                        </span>
                        <span className="bug-text">{bug.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {visibleCards >= 3 && (
              <div className="card slide-up">
                <div className="card-title yellow">
                  <span className="card-bar yellow-bg" />
                  02 / Improvements
                </div>
                <ul className="improve-list">
                  {result.improvements.map((item, i) => (
                    <li key={i} className="improve-item">
                      <span className="arrow">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {visibleCards >= 4 && (
              <div className="card slide-up">
                <div className="card-title blue">
                  <span className="card-bar blue-bg" />
                  03 / Complexity
                </div>
                <p className="complexity-text">{result.complexity}</p>
              </div>
            )}

            {visibleCards >= 5 && (
              <div className="card roast-card slide-up" style={{ borderColor: gradeInfo.color + "44" }}>
                <div className="card-title roast-title" style={{ color: gradeInfo.color }}>
                  <span className="card-bar" style={{ background: gradeInfo.color }} />
                  04 / The Roast
                  <button className="copy-btn" onClick={handleCopy} style={{ color: gradeInfo.color, borderColor: gradeInfo.color + "44" }}>
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p className="roast-text">
                  &ldquo;{typedRoast}<span className="cursor">▊</span>&rdquo;
                </p>
              </div>
            )}

          </div>
        )}
      </div>

      <footer>
        <span>RoastMyCode</span>
        <span>Next.js · Groq · Llama 3</span>
      </footer>
    </main>
  );
}
