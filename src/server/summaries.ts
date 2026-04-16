import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const AUDIENCES = ["general", "software_engineer", "data_engineer", "devops", "product_manager"] as const;
type Audience = (typeof AUDIENCES)[number];

const AUDIENCE_PROMPTS: Record<Audience, string> = {
  general: "Write a clear, neutral summary for a general technical audience.",
  software_engineer:
    "You are summarizing for a Software Engineer. Focus on architectural decisions, code patterns, libraries, APIs, performance tradeoffs, and lessons that affect day-to-day engineering work.",
  data_engineer:
    "You are summarizing for a Data Engineer. Focus on data pipelines, storage choices, schema design, batch vs streaming, scalability, and data quality concerns.",
  devops:
    "You are summarizing for a DevOps / SRE engineer. Focus on deployment, observability, reliability, infrastructure, CI/CD, incidents, and operational tradeoffs.",
  product_manager:
    "You are summarizing for a Product Manager. Focus on user impact, business outcomes, metrics, tradeoffs, and what this enables for the product roadmap.",
};

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase server env vars");
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getSummary = createServerFn({ method: "POST" })
  .inputValidator((input: { articleId: string; audience: Audience }) => {
    if (!input.articleId || !AUDIENCES.includes(input.audience)) {
      throw new Error("Invalid input");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    // Check cache
    const { data: cached } = await admin
      .from("article_summaries")
      .select("*")
      .eq("article_id", data.articleId)
      .eq("audience", data.audience)
      .maybeSingle();

    if (cached) {
      return { summary: cached.summary, key_points: cached.key_points, cached: true };
    }

    // Fetch article
    const { data: article, error: artErr } = await admin
      .from("articles")
      .select("title, excerpt, content, author")
      .eq("id", data.articleId)
      .maybeSingle();
    if (artErr || !article) throw new Error("Article not found");

    // Call Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `${AUDIENCE_PROMPTS[data.audience]}

Return STRICT JSON with this shape:
{ "summary": "<3-5 sentence summary>", "key_points": ["point 1", "point 2", "point 3", "point 4"] }
Do not include markdown fences or any other text.`;

    const userPrompt = `Title: ${article.title}
Author: ${article.author ?? "Unknown"}

${article.content ?? article.excerpt ?? ""}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      if (aiRes.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable settings.");
      throw new Error("Failed to generate summary");
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "";
    let parsed: { summary: string; key_points: string[] };
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { summary: content.slice(0, 800), key_points: [] };
    }

    // Cache
    await admin.from("article_summaries").insert({
      article_id: data.articleId,
      audience: data.audience,
      summary: parsed.summary,
      key_points: parsed.key_points ?? [],
    });

    return { summary: parsed.summary, key_points: parsed.key_points ?? [], cached: false };
  });
