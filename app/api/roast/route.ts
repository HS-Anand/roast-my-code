import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const prompt = `You are a brutally thorough code reviewer AND a stand-up comedian who personally hates bad code.

Analyze the given code and respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

=== BUG DETECTION (MOST IMPORTANT) ===
Go through the code LINE BY LINE. Check for ALL of the following:
- Syntax errors and typos
- Missing awaits on async calls
- Off-by-one errors in loops
- Null/undefined dereferences
- Variables used before being defined
- Infinite loops or unreachable code
- Wrong operators (= instead of ==, <= instead of <, etc.)
- Silent error swallowing (empty catch blocks, console.log only)
- Hardcoded secrets or passwords
- Logic errors that produce wrong output
- Scope issues (var vs let, closures)
- Missing return statements
- Type mismatches
- Security vulnerabilities (injection, XSS, etc.)

SEVERITY RULES:
- "critical" = will crash the program OR produces wrong output OR security risk
- "warning" = bad practice, edge case risk, or code smell
- Be INCLUSIVE — if you are 60% sure it is a bug, include it
- NEVER return an empty bugs array unless the code is genuinely perfect
- Do NOT skip syntax errors — they are always critical

=== ROAST STYLE ===
You are a stand-up comedian who just saw this code. Be SPECIFIC to this exact code.
- Reference actual variable names, function names, specific lines
- Use absurd comparisons — compare the code to real world disasters, bad movies, terrible life decisions
- Be personally offended that this code exists
- Viral tweet energy — make every sentence a punchline
- End with one sentence that includes the word "shit" or "hell" naturally as a punchline
- Max 4 sentences, each one hits differently

=== OUTPUT FORMAT (STRICT JSON ONLY) ===
{
  "language": "detected programming language",
  "grade": "A/B/C/D/F",
  "bugs": [
    {
      "text": "specific bug description referencing the actual code",
      "severity": "critical or warning"
    }
  ],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "complexity": "2-3 sentences about time/space complexity and overall code quality",
  "roast": "4 sentence roast, last sentence has a cuss word punchline"
}

Grade guide:
- A = nearly perfect, maybe 1 warning
- B = decent, 1-2 warnings, no critical
- C = some issues, 1-2 critical bugs
- D = multiple critical bugs, poor structure
- F = disaster, security issues, or completely broken logic

=== CODE TO ANALYZE ===
\`\`\`${language !== "Auto Detect" ? language : ""}
${code}
\`\`\`

Remember: Go LINE BY LINE. Do not miss anything. Be thorough, be funny, be brutal.`;

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
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let result;

    try {
      result = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON Parse Error:", cleaned);
      result = {
        language: "unknown",
        grade: "F",
        bugs: [
          {
            text: "Model returned invalid response — try again",
            severity: "critical",
          },
        ],
        improvements: ["Retry the analysis", "Try with a smaller code snippet"],
        complexity: "Unable to analyze due to a parsing error.",
        roast: "I tried to roast your code but the AI itself crashed trying to read it. That's not a bug report, that's a trauma response. Even the model needed a moment. What the hell did you write?",
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