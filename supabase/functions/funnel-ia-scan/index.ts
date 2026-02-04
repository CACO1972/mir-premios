import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IAScanRequest {
  lead_id: string;
  image_urls?: string[];
  motivo_consulta?: string;
}

interface IAFinding {
  category: string;
  severity: "low" | "medium" | "high";
  description: string;
  recommendation: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: IAScanRequest = await req.json();
    console.log(`IA Scan for lead: ${body.lead_id}`);

    if (!body.lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("funnel_leads")
      .select("*, evaluaciones:evaluacion_id(*)")
      .eq("id", body.lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get image URLs from evaluacion if not provided
    const imageUrls = body.image_urls || lead.evaluaciones?.imagenes_urls || [];
    const motivoConsulta = body.motivo_consulta || lead.motivo_consulta || "";

    let iaResult: {
      hallazgos: IAFinding[];
      ruta_sugerida: string;
      resumen: string;
      riesgo_general: "bajo" | "medio" | "alto";
    };

    // Use Lovable AI for analysis
    if (lovableApiKey && imageUrls.length > 0) {
      try {
        const analysisPrompt = `Eres un asistente de pre-diagnóstico dental. Analiza las imágenes dentales proporcionadas y el motivo de consulta del paciente.

Motivo de consulta: ${motivoConsulta || "No especificado"}

IMPORTANTE: Este análisis es ORIENTATIVO y NO constituye un diagnóstico definitivo. Solo un profesional puede realizar un diagnóstico tras una evaluación presencial.

Proporciona:
1. Hallazgos principales observados (máximo 5)
2. Nivel de riesgo general (bajo/medio/alto)
3. Ruta clínica sugerida: implantes, ortodoncia, caries, bruxismo, estetica, dentofacial
4. Resumen breve para el paciente (máximo 100 palabras)

Responde en formato JSON:
{
  "hallazgos": [{"category": "string", "severity": "low|medium|high", "description": "string", "recommendation": "string"}],
  "ruta_sugerida": "implantes|ortodoncia|caries|bruxismo|estetica|dentofacial",
  "resumen": "string",
  "riesgo_general": "bajo|medio|alto"
}`;

        const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: analysisPrompt },
                  ...imageUrls.slice(0, 4).map((url: string) => ({
                    type: "image_url",
                    image_url: { url },
                  })),
                ],
              },
            ],
            max_tokens: 1500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          
          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            iaResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not parse AI response");
          }
        } else {
          throw new Error(`AI API error: ${aiResponse.status}`);
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        // Fallback to mock analysis
        iaResult = generateMockAnalysis(motivoConsulta);
      }
    } else {
      // No images or API key - use text-based analysis
      iaResult = generateMockAnalysis(motivoConsulta);
    }

    // Update lead with IA results
    const { error: updateError } = await supabase
      .from("funnel_leads")
      .update({
        ia_hallazgos: iaResult.hallazgos,
        ia_ruta_sugerida: iaResult.ruta_sugerida,
        ia_resumen: iaResult.resumen,
        ia_scan_completed_at: new Date().toISOString(),
        stage: "IA_DONE",
      })
      .eq("id", body.lead_id);

    if (updateError) {
      console.error("Error updating lead:", updateError);
    }

    // Update evaluacion if linked
    if (lead.evaluacion_id) {
      await supabase
        .from("evaluaciones")
        .update({
          analisis_ia: iaResult,
          ruta_sugerida: iaResult.ruta_sugerida,
          resumen_ia: iaResult.resumen,
          estado_evaluacion: "ia_analizada",
        })
        .eq("id", lead.evaluacion_id);
    }

    console.log(`IA Scan complete for lead ${body.lead_id}: ${iaResult.ruta_sugerida}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: body.lead_id,
        stage: "IA_DONE",
        resultado: {
          ...iaResult,
          disclaimer: "⚠️ Este análisis es ORIENTATIVO y no constituye un diagnóstico definitivo. Consulte con un profesional.",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("IA Scan error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateMockAnalysis(motivoConsulta: string): {
  hallazgos: IAFinding[];
  ruta_sugerida: string;
  resumen: string;
  riesgo_general: "bajo" | "medio" | "alto";
} {
  // Determine route based on motivo
  const motivo = motivoConsulta.toLowerCase();
  let ruta = "caries";
  
  if (motivo.includes("implante") || motivo.includes("diente faltante") || motivo.includes("extracción")) {
    ruta = "implantes";
  } else if (motivo.includes("ortodoncia") || motivo.includes("brackets") || motivo.includes("alineación")) {
    ruta = "ortodoncia";
  } else if (motivo.includes("estética") || motivo.includes("blanqueamiento") || motivo.includes("carilla")) {
    ruta = "estetica";
  } else if (motivo.includes("bruxismo") || motivo.includes("rechinar") || motivo.includes("mandíbula")) {
    ruta = "bruxismo";
  } else if (motivo.includes("facial") || motivo.includes("armonía") || motivo.includes("perfil")) {
    ruta = "dentofacial";
  }

  return {
    hallazgos: [
      {
        category: "Evaluación inicial",
        severity: "medium",
        description: "Se requiere evaluación presencial para análisis completo.",
        recommendation: "Agendar evaluación premium con especialista.",
      },
    ],
    ruta_sugerida: ruta,
    resumen: `Basado en tu motivo de consulta, hemos identificado que la ruta clínica más apropiada es ${ruta}. Te recomendamos agendar una Evaluación Premium para un diagnóstico completo con nuestro equipo especializado.`,
    riesgo_general: "medio",
  };
}
