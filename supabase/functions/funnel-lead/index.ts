import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadRequest {
  nombre: string;
  email: string;
  telefono?: string;
  rut?: string;
  motivo_consulta?: string;
  origen?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: LeadRequest = await req.json();
    console.log("Creating funnel lead:", JSON.stringify(body));

    // Validate required fields
    if (!body.nombre || !body.email) {
      return new Response(
        JSON.stringify({ error: "nombre and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if lead already exists by email or RUT
    let existingLead = null;
    if (body.rut) {
      const { data: byRut } = await supabase
        .from("funnel_leads")
        .select("id, stage")
        .eq("rut", body.rut)
        .single();
      existingLead = byRut;
    }
    
    if (!existingLead) {
      const { data: byEmail } = await supabase
        .from("funnel_leads")
        .select("id, stage")
        .eq("email", body.email)
        .single();
      existingLead = byEmail;
    }

    if (existingLead) {
      console.log(`Existing lead found: ${existingLead.id}, stage: ${existingLead.stage}`);
      return new Response(
        JSON.stringify({ 
          lead_id: existingLead.id, 
          stage: existingLead.stage,
          is_existing: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new lead in funnel_leads
    const { data: lead, error: leadError } = await supabase
      .from("funnel_leads")
      .insert({
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono,
        rut: body.rut,
        motivo_consulta: body.motivo_consulta,
        origen: body.origen || "web",
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
        stage: "LEAD",
      })
      .select("id, stage")
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      throw leadError;
    }

    console.log(`Lead created: ${lead.id}`);

    // Also create in evaluaciones for backward compatibility
    const { data: evaluacion, error: evalError } = await supabase
      .from("evaluaciones")
      .insert({
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono,
        rut: body.rut,
        motivo_consulta: body.motivo_consulta,
        tipo_ruta: "paciente_nuevo",
        estado_evaluacion: "iniciada",
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (evalError) {
      console.error("Error creating evaluacion:", evalError);
    } else {
      // Link evaluacion to lead
      await supabase
        .from("funnel_leads")
        .update({ evaluacion_id: evaluacion.id })
        .eq("id", lead.id);
    }

    // Sync to Dentalink if API token is configured
    const dentalinkToken = Deno.env.get("DENTALINK_API_TOKEN");
    if (dentalinkToken && body.rut) {
      try {
        const dentalinkResponse = await fetch(`${supabaseUrl}/functions/v1/dentalink-integration`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: "create_patient",
            patient: {
              nombres: body.nombre.split(" ")[0],
              apellidos: body.nombre.split(" ").slice(1).join(" ") || body.nombre,
              rut: body.rut,
              email: body.email,
              telefono: body.telefono,
            },
          }),
        });
        
        if (dentalinkResponse.ok) {
          const dentalinkData = await dentalinkResponse.json();
          if (dentalinkData.patient_id) {
            await supabase
              .from("funnel_leads")
              .update({ dentalink_patient_id: dentalinkData.patient_id })
              .eq("id", lead.id);
            console.log(`Dentalink patient synced: ${dentalinkData.patient_id}`);
          }
        }
      } catch (dentalinkError) {
        console.error("Dentalink sync error (non-blocking):", dentalinkError);
      }
    }

    return new Response(
      JSON.stringify({ 
        lead_id: lead.id,
        evaluacion_id: evaluacion?.id,
        stage: lead.stage,
        is_existing: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Funnel lead error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
