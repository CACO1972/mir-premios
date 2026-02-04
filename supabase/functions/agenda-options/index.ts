import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AgendaRequest {
  lead_id: string;
  ruta_sugerida?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// HealthAtom booking links by specialty
const BOOKING_LINKS: Record<string, string> = {
  ortodoncia: "https://ff.healthatom.io/QVVP56",
  implantes: "https://ff.healthatom.io/v68xCg",
  estetica: "https://ff.healthatom.io/L4ngYV",
  dentofacial: "https://ff.healthatom.io/L4ngYV",
  caries: "https://ff.healthatom.io/TA6eA1",
  bruxismo: "https://ff.healthatom.io/TA6eA1",
  general: "https://ff.healthatom.io/TA6eA1",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dentalinkToken = Deno.env.get("DENTALINK_API_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: AgendaRequest = await req.json();
    console.log(`Getting agenda options for lead: ${body.lead_id}`);

    if (!body.lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("funnel_leads")
      .select("*")
      .eq("id", body.lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate lead has paid
    if (lead.stage !== "PAID" && lead.payment_status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Payment required before scheduling" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rutaSugerida = body.ruta_sugerida || lead.ia_ruta_sugerida || "general";
    const bookingLink = BOOKING_LINKS[rutaSugerida] || BOOKING_LINKS.general;

    // If Dentalink is configured, try to get available slots
    let availableSlots: Array<{ date: string; time: string; specialist?: string }> = [];
    
    if (dentalinkToken) {
      try {
        const startDate = body.fecha_inicio || new Date().toISOString().split("T")[0];
        const endDate = body.fecha_fin || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Query Dentalink for available slots (implementation depends on their API)
        const dentalinkResponse = await fetch(
          `https://api.dentalink.healthatom.com/api/v1/sucursales`,
          {
            headers: {
              "Authorization": `Token ${dentalinkToken}`,
            },
          }
        );

        if (dentalinkResponse.ok) {
          const branches = await dentalinkResponse.json();
          console.log(`Found ${branches.data?.length || 0} Dentalink branches`);
          
          // For now, we'll use the HealthAtom booking links which handle availability
          // In a full implementation, you'd query /api/v1/citas/disponibles
        }
      } catch (dentalinkError) {
        console.error("Dentalink API error (non-blocking):", dentalinkError);
      }
    }

    // Generate sample slots for the next 7 days
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split("T")[0];
      availableSlots.push(
        { date: dateStr, time: "09:00" },
        { date: dateStr, time: "10:30" },
        { date: dateStr, time: "12:00" },
        { date: dateStr, time: "15:00" },
        { date: dateStr, time: "16:30" }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: body.lead_id,
        ruta_sugerida: rutaSugerida,
        booking_link: bookingLink,
        available_slots: availableSlots.slice(0, 15), // Limit to 15 slots
        instructions: "Puede agendar directamente usando el link de reserva o seleccionar un horario disponible.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Agenda options error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
