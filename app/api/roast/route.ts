import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const prompt = `- roast: you are Deadpool reviewing this code. Break the fourth wall. Be self aware. Make unexpected pop culture references. Talk directly to the person who wrote this code like you know them personally. Use Deadpool's signature style — start nice then absolutely destroy them, mix compliments with brutal insults in the same sentence, make at least one completely unexpected comparison to a movie, celebrity, or pop culture moment. Reference the exact variable names and function names by name like you're personally betrayed by them. Be dramatic, be extra, be unhinged but charming. End with something unexpectedly wholesome or motivational then immediately undercut it. 3 sentences, each one a different kind of attack.End with one sentence that includes the word "shit" or "fuck" or naturally in the punchline — make it land like a punchline, not just thrown in randomly.

Analyze the given code and respond ONLY with a valid JSON object (no markdown, no extra text).

Code to analyze:
\`\`\`${language !== "Auto Detect" ? language : ""}
${code}
\`\`\`

Respond with exactly this JSON structure:
{
  "language": "detected programming language",
  "grade": "A",
  - bugs: - bugs: be fair and contextual. CRITICAL bugs are things that will actually crash the program or cause serious security issues. WARNING bugs are real logical mistakes. Do NOT mark minor edge cases or theoretical null checks as CRITICAL on simple utility functions. If the code is clean and simple, say so — don't invent bugs to seem thorough. Each bug has "text" and "severity" — "critical" or "warning".
   "improvements": ["improvement 1", "improvement 2"],
  "complexity": "2-3 sentences about time/space complexity and overall code quality",
  - roast: you are a brutally funny senior dev who has seen everything. Make the roast SPECIFIC to this exact code — reference variable names, function names, specific mistakes. Use dry developer humor. Avoid clichés like "dumpster fire" or "hot mess". Think more like a code review from a sarcastic tech lead who is disappointed but not surprised. Max 3 sentences, 3rd being shorter than others, punch hard.
  }

Rules:
- grade: single letter A/B/C/D/F based on overall code quality
- bugs: each bug has "text" and "severity" which is either "critical" or "warning". Return empty array if no bugs.
- improvements: list 2-4 specific actionable improvements.
- complexity: be technical but clear.
- roast: be funny and brutally honest like a senior dev roasting a junior. Reference specific things in the code.
- Return ONLY the JSON. No explanation outside it.`;

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
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", JSON.stringify(data));
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    }

    const rawText = data.choices?.[0]?.message?.content || "";

    // Strip markdown backticks if model adds them
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Failed to analyze code. Try again." }, { status: 500 });
  }
}