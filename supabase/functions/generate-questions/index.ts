import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId, jobRole, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer. Generate exactly 5 interview questions.",
          },
          {
            role: "user",
            content: `Generate 5 ${difficulty} difficulty interview questions for a ${jobRole} position. Return ONLY a JSON array of strings, no other text. Example: ["Question 1?", "Question 2?"]`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_questions",
              description: "Return 5 interview questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of 5 interview questions",
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_questions" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let questions: string[];

    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      questions = args.questions;
    } else {
      // Fallback: try to parse content
      const content = aiData.choices?.[0]?.message?.content || "[]";
      const match = content.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : [];
    }

    if (!questions || questions.length === 0) {
      // Provide defaults
      questions = [
        `Tell me about yourself and why you're interested in this ${jobRole} role.`,
        `What's your greatest strength as a ${jobRole}?`,
        `Describe a challenging project you worked on.`,
        `How do you handle disagreements with team members?`,
        `Where do you see yourself in 5 years?`,
      ];
    }

    // Insert questions
    const inserts = questions.slice(0, 5).map((q, i) => ({
      session_id: sessionId,
      question_text: q,
      question_order: i + 1,
    }));

    const { error } = await supabase.from("interview_questions").insert(inserts);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
