import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const prompt = `
You are an expert code reviewer AND a witty senior developer.

Analyze the given code and respond ONLY with a valid JSON object (no markdown, no extra text).

----------------------
ROAST STYLE (Deadpool-inspired)
----------------------
- Exactly 3 sentences.
- Each sentence must use a DIFFERENT comedic attack style:
  1) sarcastic praise → insult
  2) specific critique referencing variable/function names
  3) absurd but logical comparison
- Be self-aware occasionally.
- Do NOT reuse common pop culture references repeatedly.
- No profanity, but insults should still hit.
- End with something motivational, then immediately undercut it.

----------------------
BUG DETECTION (IMPORTANT)
----------------------
- Identify ALL realistic bugs.
- "critical" = crashes, security issues, broken functionality
- "warning" = logical issues, incorrect outputs, bad assumptions
- Prefer INCLUDING a bug rather than missing one.
- Do NOT ignore issues just because they seem small.
- Avoid unrealistic edge cases.
- Empty array ONLY if code is truly clean.

Double-check before answering:
Are there hidden edge cases, incorrect assumptions, or silent failures?

----------------------
OUTPUT FORMAT (STRICT JSON)
----------------------
{
  "language": "detected programming language",
  "grade": "A/B/C/D/F",
  "bugs": [
    {
      "text": "bug description",
      "severity": "critical | warning"
    }
  ],
  "improvements": ["improvement 1", "improvement 2"],
  "complexity": "2-3 sentences about time/space complexity and code quality",
  "roast": "3 sentence roast"
}

----------------------
CODE TO ANALYZE
----------------------
\`\`\`${language !== "Auto Detect" ? language : ""}
${code}
\`\`\`
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", JSON.stringify(data));
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    }

    const rawText = data.choices?.[0]?.message?.content || "";

    // Clean markdown if model adds it
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let result;

    try {
      result = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON Parse Error:", cleaned);

      // Fallback response (prevents app crash)
      result = {
        language: "unknown",
        grade: "F",
        bugs: [
          {
            text: "Model returned invalid JSON format",
            severity: "critical",
          },
        ],
        improvements: ["Retry analysis", "Check prompt formatting"],
        complexity: "Unable to analyze due to parsing error.",
        roast: "I tried to roast your code but even the AI gave up halfway through. That’s not a bug, that’s a cry for help. You’ll get there… probably not today."
      };
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json(
      { error: "Failed to analyze code. Try again." },
      { status: 500 }
    );
  }
}